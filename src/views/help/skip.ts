import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Skip";
const DESCRIPTION = "Skips the current song.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/skip`" }];

export class SkipCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
