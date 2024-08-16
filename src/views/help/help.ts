import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Help";
const DESCRIPTION =
    "Displays the list of available commands. If command is specified, displays the help page for that command.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/help [command]`" }];

export class HelpCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
