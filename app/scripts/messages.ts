import { JSON, JsonObject, JsonProperty, JsonElementType } from "ta-json";

export abstract class Message {

    static tryDeserialize(obj: any): Message | undefined {
        switch(obj.messageType) {
            case Copy.name:
                return Copy.deserialize(obj);
            case Copied.name:
                return Copied.deserialize(obj);
            case OptionSaved.name:
                return OptionSaved.deserialize(obj);
            default:
                return undefined;
        }
    }

    readonly messageType: string
}

@JsonObject()
export class Copy implements Message {

    static deserialize(obj: any): Copy {
        return JSON.deserialize(obj, Copy);
    }

    @JsonProperty()
    readonly messageType: string = Copy.name;

    @JsonProperty()
    readonly templateId: string;

    constructor(templateId: string) {
        this.templateId = templateId;
    }
}

@JsonObject()
export class Copied implements Message {

    static deserialize(obj: any): Copied {
        return JSON.deserialize(obj, Copied);
    }

    @JsonProperty()
    readonly messageType: string = Copied.name;

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

    static deserialize(obj: any): OptionSaved {
        return JSON.deserialize(obj, OptionSaved);
    }

    @JsonProperty()
    readonly messageType: string = OptionSaved.name;
}
