import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Join";
const DESCRIPTION =
    "Joins a voice channel. If channel is not specified, joins the user's current voice channel.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/join [channel]`" }];

class JoinCommandHelpView extends CommandHelpView {
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

export default new JoinCommandHelpView();
