import {
    ChatInputCommandInteraction,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types";
import { HelpView } from "../../views";

export class HelpCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 2;
        this.data = new SlashCommandBuilder()
            .setName("help")
            .setDescription("Displays the list of available commands.")
            .setDMPermission(false);
    }

    async run(interaction: ChatInputCommandInteraction) {
        const view = HelpView.instance;
        const embed = view.getEmbed();
        await interaction.reply({ embeds: [embed] });
    }
}
