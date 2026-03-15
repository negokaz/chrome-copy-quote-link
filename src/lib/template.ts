import { Copied } from "./messages";
import Mustache from 'mustache';
import { v4 as uuidv4 } from 'uuid';

// disable HTML escaping
Mustache.escape = (v) => v;

export type ContextType = 'page' | 'selection';

export class Template {

    static create(name: string, template: string, enableContexts: Array<ContextType>): Template {
        return new Template(uuidv4(), name, template, enableContexts);
    }

    static empty(): Template {
        return new Template(uuidv4(), '', '', []);
    }

    static deserialize(obj: any): Template {
        return new Template(obj.id, obj.name, obj.template, obj.enableContexts ?? []);
    }

    readonly id: string;

    readonly name: string;

    readonly template: string;

    readonly enableContexts: Array<ContextType>;

    public constructor(id: string, name: string, template: string, enableContexts: Array<ContextType>) {
        this.id = id;
        this.name = name;
        this.template = template;
        this.enableContexts = enableContexts;
    }

    validate(): null | Error {
        try {
            Mustache.parse(this.template);
        } catch (e) {
            if (e instanceof Error) {
                return e;
            }
        }
        return null;
    }

    render(copied: Copied): string {
        return Mustache.render(this.template, new TemplateView(copied.url, copied.urlWithTextFragment, copied.title, copied.selectedText));
    }

    withName(name: string) {
        return new Template(this.id, name, this.template, this.enableContexts);
    }

    withTemplate(template: string) {
        return new Template(this.id, this.name, template, this.enableContexts);
    }

    withEnableContexts(scope: ContextType) {
        return new Template(this.id, this.name, this.template, [scope]);
    }
}

class TemplateView {

    readonly url: string;

    readonly url_to_text: string;

    readonly title: string;

    readonly text: string;

    readonly texts: string[];

    constructor(url: string, url_to_text: string, title: string, text: string) {
        this.url = url;
        this.url_to_text = url_to_text;
        this.title = title;
        this.text = text;
        this.texts = text.split(/\r?\n/);
    }
}
