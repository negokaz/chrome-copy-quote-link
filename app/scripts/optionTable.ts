import { Template } from "./template";
import { JSON, JsonObject, JsonProperty, JsonElementType } from "ta-json";

@JsonObject()
export default class OptionTable {

    static deserialize(obj: any): OptionTable {
        return JSON.deserialize(obj, OptionTable, { runConstructor: true });
    }

    @JsonProperty()
    @JsonElementType(Template)
    readonly templates?: Template[] = null

    constructor(templates?: Template[]) {
        this.templates = templates;
    }

}
