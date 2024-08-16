import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Stop";
const DESCRIPTION = "Stops the music player and clears the song queue.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/stop`" }];

export class StopCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
