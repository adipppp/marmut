import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Repeat";
const DESCRIPTION =
    "Sets the repeat mode of the music player. If mode is not specified, shows the current repeat mode.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/repeat [mode]`" }];

export class RepeatCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
