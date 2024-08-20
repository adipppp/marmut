import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../..";

const TITLE = "Search";
const DESCRIPTION = "Searches for songs to play.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/search <query>`" }];

class SearchCommandHelpView extends CommandHelpView {
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

export default new SearchCommandHelpView();
