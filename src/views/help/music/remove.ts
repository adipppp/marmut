import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Remove";
const DESCRIPTION = "Removes a song from the queue.";
const FIELDS: APIEmbedField[] = [
    { name: "Usage", value: "`/remove <position>`" },
];

class RemoveCommandHelpView extends CommandHelpView {
    readonly commandName: string;

    constructor() {
        super();
        this.commandName = TITLE.toLowerCase();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}

export default new RemoveCommandHelpView();
