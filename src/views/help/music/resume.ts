import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Resume";
const DESCRIPTION = "Resumes the currently paused song.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/resume`" }];

class ResumeCommandHelpView extends CommandHelpView {
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

export default new ResumeCommandHelpView();
