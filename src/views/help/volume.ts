import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Volume";
const DESCRIPTION =
    "Sets the volume of the music player. If volume is not specified, shows the current volume.";
const FIELDS: APIEmbedField[] = [
    { name: "Usage", value: "`/volume [volume]`" },
];

export class VolumeCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
