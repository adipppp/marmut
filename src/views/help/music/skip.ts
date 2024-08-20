import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Skip";
const DESCRIPTION = "Skips the current song.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/skip`" }];

class SkipCommandHelpView extends CommandHelpView {
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

export default new SkipCommandHelpView();
