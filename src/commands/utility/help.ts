import {
    ChatInputCommandInteraction,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types";
import { helpView } from "../../views";

export class HelpCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 2;
        this.data = new SlashCommandBuilder()
            .setName("help")
            .setDescription("Displays the list of available commands.")
            .setDMPermission(false)
            .addStringOption((builder) =>
                builder
                    .setName("command")
                    .setDescription(
                        "The command whose help page will be fetched."
                    )
                    .setRequired(false)
            );
    }

    async run(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getString("command");
        const embed = helpView.getEmbed(command?.trim().toLowerCase());

        if (embed === undefined) {
            await interaction.reply({
                content:
                    "The help page for the specified command was not found.",
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({ embeds: [embed] });
    }
}
