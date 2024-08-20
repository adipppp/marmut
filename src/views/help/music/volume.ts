import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Volume";
const DESCRIPTION =
    "Sets the volume of the music player. If volume is not specified, shows the current volume.";
const FIELDS: APIEmbedField[] = [
    { name: "Usage", value: "`/volume [volume]`" },
];

class VolumeCommandHelpView extends CommandHelpView {
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

export default new VolumeCommandHelpView();
