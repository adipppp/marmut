import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Stop";
const DESCRIPTION = "Stops the music player and clears the song queue.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/stop`" }];

class StopCommandHelpView extends CommandHelpView {
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

export default new StopCommandHelpView();
