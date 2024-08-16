import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Resume";
const DESCRIPTION = "Resumes the currently paused song.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/resume`" }];

export class ResumeCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
