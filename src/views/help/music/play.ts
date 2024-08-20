import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Play";
const DESCRIPTION = "Plays a song.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/play <song>`" }];

class PlayCommandHelpView extends CommandHelpView {
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

export default new PlayCommandHelpView();
