export type ContextType = 'page' | 'selection';

export abstract class Message {

    static tryDeserialize(obj: any): Message | undefined {
        switch(obj.messageType) {
            case Copy.messageType:
                return Copy.deserialize(obj);
            case Copied.messageType:
                return Copied.deserialize(obj);
            case WriteToClipboard.messageType:
                return WriteToClipboard.deserialize(obj);
            case OptionSaved.messageType:
                return OptionSaved.deserialize(obj);
            case FetchPageContext.messageType:
                return FetchPageContext.deserialize(obj);
            case PageContext.messageType:
                return PageContext.deserialize(obj);
            default:
                return undefined;
        }
    }

    readonly messageType!: string;
}

export class Copy implements Message {

    static messageType = 'Copy';

    static deserialize(obj: any): Copy {
        return new Copy(obj.templateId);
    }

    readonly messageType: string = Copy.messageType;

    readonly templateId: string;

    constructor(templateId: string) {
        this.templateId = templateId;
    }
}

export class Copied implements Message {

    static messageType = 'Copied';

    static deserialize(obj: any): Copied {
        return new Copied(obj.templateId, obj.title, obj.url, obj.urlWithTextFragment, obj.selectedText);
    }

    readonly messageType: string = Copied.messageType;

    readonly templateId: string;

    readonly title: string;

    readonly url: string;

    readonly urlWithTextFragment: string;

    readonly selectedText: string;

    constructor(templateId: string, title: string, url: string, urlWithTextFragment: string, selectedText: string) {
        this.templateId = templateId;
        this.title = title;
        this.url = url;
        this.urlWithTextFragment = urlWithTextFragment;
        this.selectedText = selectedText;
    }
}

export class WriteToClipboard implements Message {

    static messageType = 'WriteToClipboard';

    static deserialize(obj: any): WriteToClipboard {
        return new WriteToClipboard(obj.text);
    }

    readonly messageType: string = WriteToClipboard.messageType;

    readonly text: string;

    constructor(text: string) {
        this.text = text;
    }
}

export class OptionSaved implements Message {

    static messageType = 'OptionSaved';

    static deserialize(obj: any): OptionSaved {
        return new OptionSaved();
    }

    readonly messageType: string = OptionSaved.messageType;
}

export class FetchPageContext implements Message {

    static messageType = 'FetchPageContext';

    static deserialize(obj: any): FetchPageContext {
        return new FetchPageContext();
    }

    readonly messageType: string = FetchPageContext.messageType;
}

export class PageContext implements Message {

    static messageType = 'PageContext';

    static deserialize(obj: any): PageContext {
        return new PageContext(obj.contextType);
    }

    readonly messageType: string = PageContext.messageType;

    readonly contextType: ContextType;

    constructor(contextType: ContextType) {
        this.contextType = contextType;
    }
}
