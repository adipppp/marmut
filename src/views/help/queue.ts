import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Queue";
const DESCRIPTION = "Displays the song queue and the now-playing song.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/queue`" }];

export class QueueCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
