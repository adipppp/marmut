import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Queue";
const DESCRIPTION = "Displays the song queue and the now-playing song.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/queue`" }];

class QueueCommandHelpView extends CommandHelpView {
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

export default new QueueCommandHelpView();
