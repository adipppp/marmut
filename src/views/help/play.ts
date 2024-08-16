import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Play";
const DESCRIPTION = "Plays a song.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/play <song>`" }];

export class PlayCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
