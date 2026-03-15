import { Template } from "./template";

export default class OptionTable {

    static deserialize(obj: any): OptionTable {
        if (!obj) return new OptionTable([]);
        const templates = obj.templates ? obj.templates.map((t: any) => Template.deserialize(t)) : [];
        return new OptionTable(templates);
    }

    readonly templates: Template[];

    constructor(templates: Template[]) {
        this.templates = templates;
    }
}
