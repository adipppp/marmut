import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Join";
const DESCRIPTION =
    "Joins a voice channel. If channel is not specified, joins the user's current voice channel.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/join [channel]`" }];

export class JoinCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
