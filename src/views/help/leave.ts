import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Leave";
const DESCRIPTION = "Disconnects from the voice channel.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/leave`" }];

export class LeaveCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
