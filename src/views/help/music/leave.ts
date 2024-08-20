import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Leave";
const DESCRIPTION = "Disconnects from the voice channel.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/leave`" }];

class LeaveCommandHelpView extends CommandHelpView {
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

export default new LeaveCommandHelpView();
