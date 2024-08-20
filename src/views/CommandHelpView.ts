import { Colors, EmbedBuilder } from "discord.js";

const MARMUT_ICON_40PX = process.env.MARMUT_ICON_40PX;

export abstract class CommandHelpView {
    abstract readonly commandName: string;
    protected readonly embed: EmbedBuilder;

    constructor() {
        this.embed = this.createEmbed();
    }

    private createEmbed() {
        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setFooter({ text: "Marmut", iconURL: MARMUT_ICON_40PX })
            .setTimestamp();

        return embed;
    }

    getEmbed() {
        return this.embed;
    }
}
