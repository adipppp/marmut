import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Repeat";
const DESCRIPTION =
    "Sets the repeat mode of the music player. If mode is not specified, shows the current repeat mode.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/repeat [mode]`" }];

class RepeatCommandHelpView extends CommandHelpView {
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

export default new RepeatCommandHelpView();
