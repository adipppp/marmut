import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Help";
const DESCRIPTION =
    "Displays the list of available commands. If command is specified, displays the help page for that command.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/help [command]`" }];

class HelpCommandHelpView extends CommandHelpView {
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

export default new HelpCommandHelpView();
