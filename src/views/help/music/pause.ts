import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Pause";
const DESCRIPTION = "Pauses the current song. Use /resume to unpause.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/pause`" }];

class PauseCommandHelpView extends CommandHelpView {
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

export default new PauseCommandHelpView();
