import { JSON, JsonObject, JsonProperty, JsonElementType } from "ta-json";
import { Menus } from "webextension-polyfill-ts";

export abstract class Message {

    static tryDeserialize(obj: any): Message | undefined {
        switch(obj.messageType) {
            case Copy.messageType:
                return Copy.deserialize(obj);
            case Copied.messageType:
                return Copied.deserialize(obj);
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

    readonly messageType: string
}

@JsonObject()
export class Copy implements Message {

    static messageType = 'Copy';

    static deserialize(obj: any): Copy {
        return JSON.deserialize(obj, Copy);
    }

    @JsonProperty()
    readonly messageType: string = Copy.messageType;

    @JsonProperty()
    readonly templateId: string;

    constructor(templateId: string) {
        this.templateId = templateId;
    }
}

@JsonObject()
export class Copied implements Message {

    static messageType = 'Copied';

    static deserialize(obj: any): Copied {
        return JSON.deserialize(obj, Copied);
    }

    @JsonProperty()
    readonly messageType: string = Copied.messageType;

    @JsonProperty()
    readonly templateId: string;

    @JsonProperty()
    readonly title: string;

    @JsonProperty()
    readonly url: string;

    @JsonProperty()
    readonly urlWithTextFragment: string;

    @JsonProperty()
    readonly selectedText: string;

    constructor(templateId: string, title: string, url: string, urlWithTextFragment: string, selectedText: string) {
        this.templateId = templateId;
        this.title = title;
        this.url = url;
        this.urlWithTextFragment = urlWithTextFragment;
        this.selectedText = selectedText;
    }
}

@JsonObject()
export class OptionSaved implements Message {

    static messageType = 'OptionSaved';

    static deserialize(obj: any): OptionSaved {
        return JSON.deserialize(obj, OptionSaved);
    }

    @JsonProperty()
    readonly messageType: string = OptionSaved.messageType;
}


@JsonObject()
export class FetchPageContext implements Message {

    static messageType = 'FetchPageContext';

    static deserialize(obj: any): FetchPageContext {
        return JSON.deserialize(obj, FetchPageContext);
    }

    @JsonProperty()
    readonly messageType: string = FetchPageContext.messageType;
}

@JsonObject()
export class PageContext implements Message {

    static messageType = 'PageContext';

    static deserialize(obj: any): PageContext {
        return JSON.deserialize(obj, PageContext);
    }

    @JsonProperty()
    readonly messageType: string = PageContext.messageType;

    @JsonProperty()
    readonly contextType: Menus.ContextType

    constructor(contextType: Menus.ContextType) {
        this.contextType = contextType;
    }
}
