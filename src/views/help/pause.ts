import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Pause";
const DESCRIPTION = "Pauses the current song. Use /resume to unpause.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/pause`" }];

export class PauseCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
