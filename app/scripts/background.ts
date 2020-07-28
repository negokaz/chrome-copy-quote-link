import { browser } from "webextension-polyfill-ts";
import { Template } from "./template";
import { Message, Copied, Copy, OptionSaved, FetchPageContext } from "./messages";
import OptionTable from './optionTable';

browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (info.status && info.status === 'complete') {
        await createContextMenus();
    }
});

browser.runtime.onInstalled.addListener(async (details) => {
    await createContextMenus();
    const storage = browser.storage.local;
    const option = await fetchOption();
    if (!option.templates) {
        storage.set({ 'option': new OptionTable(initialTemplates) });
    }
});

browser.runtime.onMessage.addListener(async (message: any, sender) => {
    const msg = Message.tryDeserialize(message);

    if (msg instanceof Copy) {
        const tabs = await browser.tabs.query({active: true, currentWindow: true});
        const tab = tabs[0];
        await executePageScript(tab.id);
        await browser.tabs.sendMessage(tab.id, msg);

    } else if (msg instanceof Copied) {
        const templates = await fetchOption().then(o => o.templates);
        const renderedText = templates.find(t => t.id === msg.templateId).render(msg);
        await writeToClipboard(renderedText);
        console.debug(`[copied]\n${renderedText}`);

    } else if (msg instanceof OptionSaved) {
        await createContextMenus();

    } else if (msg instanceof FetchPageContext) {
        const tabs = await browser.tabs.query({active: true, currentWindow: true});
        const tab = tabs[0];
        await executePageScript(tab.id);
        const pageContext = await browser.tabs.sendMessage(tab.id, msg);
        return pageContext;
    }
});

async function fetchOption(): Promise<OptionTable | null> {
    const storage = browser.storage.local;
    return storage.get('option').then(d => d.option ? OptionTable.deserialize(d.option) : null);
}

async function saveOption(option: OptionTable): Promise<void> {
    const storage = browser.storage.local;
    return storage.set({ 'option': option });
}

async function executePageScript(tabId: number): Promise<void> {
    await browser.tabs.executeScript(tabId, {
        file: '/scripts/page.js',
        allFrames: false, // FIXME: set true
    });
}

const initialTemplates = [
    Template.create('Plain', `{{title}}\n{{url}}`, ['page']),
    Template.create('Plain (quote)', `{{#texts}}\n> {{.}}\n{{/texts}}\n{{title}}\n{{url}}`, ['selection']),
    Template.create('Plain (link to text)', `{{#texts}}\n> {{.}}\n{{/texts}}\n{{title}}\n{{url_to_text}}`, ['selection']),
    Template.create('Markdown', `[{{title}}]({{url}})`, ['page']),
    Template.create('Markdown (quote)', `{{#texts}}\n> {{.}}\n{{/texts}}\n>\n> [{{title}}]({{url}})`, ['selection']),
    Template.create('Markdown (link to text)', `{{#texts}}\n> {{.}}\n{{/texts}}\n>\n> [{{title}}]({{url_to_text}})`, ['selection']),
];

async function createContextMenus(): Promise<void> {
    const option = await fetchOption().then(option => {
        if (option) {
            return option;
        } else {
            const initialOption = new OptionTable(initialTemplates);
            return saveOption(initialOption).then(_ => initialOption);
        }
    });
    const contextMenuRemoved = browser.contextMenus.removeAll();
    const parentId = browser.contextMenus.create({
        title: 'Copy link as',
        contexts: ['page', 'selection'],
    });
    await contextMenuRemoved;
    option.templates.forEach((template) => {
        browser.contextMenus.create({
            parentId: parentId,
            title: template.name,
            contexts: template.enableContexts,
            onclick: async (info, tab) => {
                await executePageScript(tab.id);
                await browser.tabs.sendMessage(tab.id, new Copy(template.id));
            },
        })
    });
}

async function writeToClipboard(text: string) {
    var element = document.createElement('div');
    document.body.appendChild(element);
    element.innerText = text;
    element.addEventListener('copy', function (e) {
        e.clipboardData.setData('text/plain', text);
        e.clipboardData.setData('text/html', text);
        e.preventDefault();
    });
    element.focus();
    document.execCommand('SelectAll');
    document.execCommand('Copy', false, null);
    document.body.removeChild(element);
}
