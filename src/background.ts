import { Template } from "./lib/template";
import { Message, Copied, Copy, OptionSaved, FetchPageContext, WriteToClipboard } from "./lib/messages";
import OptionTable from './lib/optionTable';

export default defineBackground(() => {

    browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
        if (info.status && info.status === 'complete') {
            await createContextMenus();
        }
    });

    browser.runtime.onInstalled.addListener(async (details) => {
        await createContextMenus();
        const storage = browser.storage.local;
        const option = await fetchOption();
        if (!option || !option.templates) {
            storage.set({ 'option': new OptionTable(initialTemplates) });
        }
    });

    browser.runtime.onMessage.addListener(async (message: any, sender) => {
        const msg = Message.tryDeserialize(message);

        if (msg instanceof Copy) {
            const tabId = await getActiveTabId();
            await browser.tabs.sendMessage(tabId, msg);

        } else if (msg instanceof Copied) {
            const templates = await fetchOption().then(o => o?.templates ?? initialTemplates);
            const template = templates.find(t => t.id === msg.templateId);

            if (!template) {
                throw new Error(`Template not found: ${msg.templateId}`);
            }

            const renderedText = template.render(msg);
            const tabId = await getActiveTabId();
            await browser.tabs.sendMessage(tabId, new WriteToClipboard(renderedText));
            console.debug(`[copied]\n${renderedText}`);

        } else if (msg instanceof OptionSaved) {
            await createContextMenus();

        } else if (msg instanceof FetchPageContext) {
            const tabId = await getActiveTabId();
            const pageContext = await browser.tabs.sendMessage(tabId, msg);
            return Promise.resolve(pageContext);
        }
    });

    browser.contextMenus.onClicked.addListener(async (info, tab) => {
        if (!tab?.id) {
            throw new Error('Active tab is not available');
        }

        await browser.tabs.sendMessage(tab.id, new Copy(info.menuItemId as string));
    });
});

async function getActiveTabId(): Promise<number> {
    const tabs = await browser.tabs.query({active: true, currentWindow: true});
    const tabId = tabs[0]?.id;

    if (tabId == null) {
        throw new Error('Active tab is not available');
    }

    return tabId;
}

async function fetchOption(): Promise<OptionTable | null> {
    const storage = browser.storage.local;
    return storage.get('option').then(d => d.option ? OptionTable.deserialize(d.option) : null);
}

async function saveOption(option: OptionTable): Promise<void> {
    const storage = browser.storage.local;
    return storage.set({ 'option': option });
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
    await browser.contextMenus.removeAll();
    const parentId = 'copy-link-as';
    browser.contextMenus.create({
        id: parentId,
        title: 'Copy link as',
        contexts: ['page', 'selection'],
    });
    const templates = option.templates ?? initialTemplates;

    templates.forEach((template) => {
        const contexts = (template.enableContexts.length > 0 ? template.enableContexts : ['page']) as ['page' | 'selection', ...('page' | 'selection')[]];

        browser.contextMenus.create({
            id: template.id,
            parentId: parentId,
            title: template.name,
            contexts,
        });
    });
}
