import { browser, Runtime } from "webextension-polyfill-ts";
import { Copied, Copy } from "./messages";
import escapeStringRegexp from 'escape-string-regexp';

if (!browser.runtime.onMessage.hasListeners()) {
    console.log('quote-copy-link activated');
    browser.runtime.onMessage.addListener(handleMessage);
}

function handleMessage(message: Copy, sender: Runtime.MessageSender) {
    const title = document.title;
    const url = document.location.toString();
    try {
        const selection = document.getSelection();
        if (selection.toString() === '') {
            browser.runtime.sendMessage(sender.id, new Copied(message.templateId, title, url, '', ''));
        } else {
            const pageSelection = PageSelection.create(selection);
            const scrollToTextUrl =
                url.substr(0, url.length - document.location.hash.length) + pageSelection.generateTextFragment();
            browser.runtime.sendMessage(sender.id, new Copied(message.templateId, title, url, scrollToTextUrl, selection.toString().trim()));
        }
    } catch (e) {
        console.error(e);
    }
}

class PageSelection {

    static create(selection: Selection): PageSelection {
        return new PageSelection(selection);
    }

    private readonly selection: SingleSelection;

    private constructor(selection: Selection) {
        this.selection = SingleSelection.create(selection);
    }

    /**
     * Spec: https://wicg.github.io/scroll-to-text-fragment/
     */
    generateTextFragment(): string {
        console.group('generateTextFragment');

        let prefix              = TextFragmentRange.startPointOf(this.selection);
        let prefixChanged       = true;
        let textStart           = TextFragmentRange.startPointOf(this.selection);
        let textStartChanged    = true;
        let textEnd             = TextFragmentRange.endPointOf(this.selection);
        let textEndChanged      = true;
        let suffix              = TextFragmentRange.endPointOf(this.selection);
        let suffixChanged       = true;

        const wholeText = document.body.innerText;

        let bestSearchConditionsFound   = false;
        let overlapStartAndEnd          = false;
        try {
            while (!bestSearchConditionsFound && (prefixChanged || textStartChanged || textEndChanged || suffixChanged)) {
                if (!overlapStartAndEnd) {
                    // While the matching text and its prefix/suffix can span across block-boundaries, the individual parameters to these steps cannot.
                    // That is, each of prefix, textStart, textEnd, and suffix will only match text within a single block.
                    [textStartChanged, textStart]   = textStart.extendWithinASingleBlock('forward', 'word');
                    [textEndChanged, textEnd]       = textEnd.extendWithinASingleBlock('backward', 'word');
                    overlapStartAndEnd  = textStart.isOverlapWith(textEnd);
                }
                if (overlapStartAndEnd || !(textStartChanged || textEndChanged)) {
                    [prefixChanged, prefix] = prefix.extendWithinASingleBlock('backward', 'word');
                    [suffixChanged, suffix] = suffix.extendWithinASingleBlock('forward', 'word');
                }
                if (overlapStartAndEnd) {
                    textStart.detach();
                    textEnd.detach();
                    textStart  = TextFragmentRange.of(this.selection);
                    textEnd    = TextFragmentRange.endPointOf(this.selection);
                }
                console.debug(`[condition] prefix: "${prefix}", textStart: "${textStart}", textEnd: "${textEnd}", suffix: "${suffix}"`);
                if (textStart.hasText()) {
                    // check
                    const regex = `${this.escapeRegex(prefix.getText())}\\s*(${this.escapeRegex(textStart.getText())}${textEnd.hasText() ? '.*?' + this.escapeRegex(textEnd.getText()) : ''})\\s*${this.escapeRegex(suffix.getText())}`;
                    const match = wholeText.match(new RegExp(regex, 'si'));
                    if (match === null) {
                        throw Error(`[No match] prefix: "${prefix}", textStart: "${textStart}", textEnd: "${textEnd}", suffix: "${suffix}"`);
                    }
                    const selectionText = this.normalizeString(this.selection.getText());
                    const matchText = this.normalizeString(match[1]);
                    console.debug('[selection]\n' + selectionText);
                    console.debug('[matched]\n' + matchText);
                    if (matchText === selectionText) {
                        console.debug('Best search conditions found!');
                        bestSearchConditionsFound = true;
                    } else {
                        console.debug('This search conditions are not good. Will try again.');
                    }
                }
            }
        } catch (e) {
            console.error(e);
            return '';
        } finally {
            // reset selection
            [prefix, textStart, textEnd, suffix].forEach(r => r.detach());
            console.groupEnd();
        }
        return `#:~:text=${prefix.hasText() ? this.encodeCharString(prefix.getText()) + '-,' : ''}${this.encodeCharString(textStart.getText())}${textEnd.hasText() ? ',' + this.encodeCharString(textEnd.getText()) : ''}${suffix.hasText() ? ',-' + this.encodeCharString(suffix.getText()) : ''}`;
    }

    private normalizeString(text: string): string {
        return text.trim().replace(/\s+/sg, ' ');
    }

    private escapeRegex(text: string): string {
        return escapeStringRegexp(text).replace(/[\r\n]/, '\\s+');
    }

    private encodeCharString(text: string): string {
        // https://wicg.github.io/scroll-to-text-fragment/#fragment-directive-grammar
        return encodeURI(text)
                .replace('-', this.encodePercent('-'))
                .replace('#', this.encodePercent('#'))
                .replace('&', this.encodePercent('&'))
                .replace(',', this.encodePercent(','));
    }

    private encodePercent(text: string): string {
        let encoded = '';
        const length = text.length;
        for (let i = 0; i < length; i++) {
            encoded = encoded + '%' + text.codePointAt(i).toString(16)
        }
        return encoded;
    }
}

class SingleSelection {

    static create(selection: Selection): SingleSelection {
        return new SingleSelection(selection);
    }

    readonly selection: Selection;

    constructor(selection: Selection) {
        if (selection.rangeCount !== 1) {
            throw Error(`Selection must have only one range: ${selection.rangeCount}`);
        }
        this.selection = selection;
    }

    getRange(): Range {
        return this.selection.getRangeAt(0);
    }

    setRange(range: Range): void {
        this.selection.removeAllRanges();
        this.selection.addRange(range);
    }

    extend(direction: Direction, granularity: Granularity): void {
        if (direction === 'forward') {
            this.selection.modify('extend', direction, granularity);
        } else {
            // backward
            const range = this.getRange();
            const endContainer = range.endContainer;
            const endOffset = range.endOffset;
            this.selection.collapseToStart();
            this.selection.modify('extend', direction, granularity);
            this.selection.setBaseAndExtent(this.selection.focusNode, this.selection.focusOffset, endContainer, endOffset);
        }
    }

    getText(): string {
        return this.selection.toString().trim();
    }
}

class TextFragmentRange {

    static of(selection: SingleSelection): TextFragmentRange {
        const selectionRange = selection.getRange();
        const range = selectionRange.cloneRange();
        return new TextFragmentRange(range, selection.getText(), selection);
    }

    static startPointOf(selection: SingleSelection): TextFragmentRange {
        const selectionRange = selection.getRange();
        const range = selectionRange.cloneRange();
        range.collapse(true);
        return new TextFragmentRange(range, '', selection);
    }

    static endPointOf(selection: SingleSelection): TextFragmentRange {
        const selectionRange = selection.getRange();
        const range = selectionRange.cloneRange();
        range.collapse(false);
        return new TextFragmentRange(range, '', selection);
    }

    private readonly range: Range;

    private readonly rangeText: string;

    private readonly selection: SingleSelection;

    private constructor(range: Range, rangeText: string, selection: SingleSelection) {
        this.range = range;
        this.rangeText = rangeText;
        this.selection = selection;
    }

    extend(direction: Direction, granularity: Granularity): TextFragmentRange {
        const selectionRange = this.selection.getRange()
        try {
            this.selection.setRange(this.range);
            this.selection.extend(direction, granularity);
            return new TextFragmentRange(this.selection.getRange(), this.selection.getText(), this.selection);
        } finally {
            this.selection.setRange(selectionRange);
        }
    }

    extendWithinASingleBlock(direction: Direction, granularity: Granularity): [boolean, TextFragmentRange] {
        const movingPointContainerOf = (range: Range) => direction === 'forward' ? range.endContainer : range.startContainer;

        const ancestorBlockElement = this.findAncestorBlockElement(movingPointContainerOf(this.range));
        const newRange = this.extend(direction, granularity);
        const newAncestorBlockElement = this.findAncestorBlockElement(movingPointContainerOf(newRange.range));
        if (this.rangeText !== '' && ancestorBlockElement !== newAncestorBlockElement) {
            // out of the block element
            return [false, this];
        }
        return [true, newRange];
    }

    getText(): string {
        return this.rangeText;
    }

    detach(): void {
        this.range.detach();
    }

    isOverlapWith(backwardRange: TextFragmentRange): boolean {
        // https://developer.mozilla.org/en-US/docs/Web/API/Range/compareBoundaryPoints
        return this.range.compareBoundaryPoints(Range.START_TO_START, backwardRange.range)     !== -1
                || this.range.compareBoundaryPoints(Range.START_TO_END, backwardRange.range)   !== -1
                || this.range.compareBoundaryPoints(Range.END_TO_START, backwardRange.range)   !== -1
                || this.range.compareBoundaryPoints(Range.END_TO_END, backwardRange.range)     !== -1;
    }

    hasText(): boolean {
        return this.rangeText.trim().length > 0;
    }

    toString(): string {
        return this.rangeText;
    }

    private findAncestorBlockElement(node: Node): Element {
        let element = node.parentElement;
        while (window.getComputedStyle(element).display === 'inline') {
            element = element.parentElement;
        }
        return element;
    }
}

declare global {

    type Alter          = 'move' | 'extend';
    type Direction      = 'forward' | 'backward';
    type Granularity    = 'character' | 'word' | 'line';

    interface Selection {
        // https://developer.mozilla.org/en-US/docs/Web/API/Selection/modify
        modify(alter: Alter, direction: Direction, granularity: Granularity): void;
    }
}
