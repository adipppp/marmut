import { APIEmbedField } from "discord.js";
import { CommandHelpView } from "../CommandHelpView";

const TITLE = "Search";
const DESCRIPTION = "Searches for songs to play.";
const FIELDS: APIEmbedField[] = [{ name: "Usage", value: "`/search <query>`" }];

export class SearchCommandHelpView extends CommandHelpView {
    constructor() {
        super();
        this.embed
            .setTitle(TITLE)
            .setDescription(DESCRIPTION)
            .addFields(FIELDS);
    }
}
