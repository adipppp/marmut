import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Remove";
const DESCRIPTION = "Removes a song from the queue.";
const FIELDS: APIEmbedField[] = [
    { name: "Usage", value: "`/remove <position>`" },
];

export class RemoveCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
