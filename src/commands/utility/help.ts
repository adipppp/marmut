import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS } from "../../config";
import { helpView } from "../../views";

export default class HelpCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.SLOW;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("help")
            .setDescription("Displays the list of available commands.")
            .setContexts(InteractionContextType.Guild)
            .addStringOption((builder) =>
                builder
                    .setName("command")
                    .setDescription(
                        "The command whose help page will be fetched.",
                    )
                    .setRequired(false),
            );
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const command = interaction.options.getString("command");
        const embed = helpView.getEmbed(command?.trim().toLowerCase());

        if (embed === undefined) {
            await this.replyWithError(
                interaction,
                "The help page for the specified command was not found.",
            );
            return;
        }

        await interaction.reply({ embeds: [embed] });
    }
}
