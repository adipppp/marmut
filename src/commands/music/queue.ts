import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    Snowflake,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientInVoiceChannelOf,
    createMusicPlayer,
    inVoiceChannel,
} from "../../utils/functions";
import { musicPlayers } from "../../core/music";
import { QueueView } from "../../views/QueueView";

export class QueueCommand implements Command {
    readonly data: SlashCommandOptionsOnlyBuilder;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("queue")
            .setDescription("Displays the current song queue.");
    }

    private async validatePreconditions(
        interaction: ButtonInteraction | ChatInputCommandInteraction
    ) {
        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!inVoiceChannel(member)) {
            await interaction.reply({
                content:
                    "You need to be in a voice channel to use this command.",
                ephemeral: true,
            });
            return false;
        }

        if (!clientInVoiceChannelOf(guild)) {
            await interaction.reply({
                content: "Bot is not connected to any voice channel.",
                ephemeral: true,
            });
            return false;
        }

        if (!clientInSameVoiceChannelAs(member)) {
            await interaction.reply({
                content: "You need to be in the same voice channel as the bot.",
                ephemeral: true,
            });
            return false;
        }

        const guildId = guild.id;
        const player = musicPlayers.get(guildId) ?? createMusicPlayer(guildId);

        if (!player || player.isIdle()) {
            await interaction.reply({
                content: "There is no song playing.",
                ephemeral: true,
            });
            return false;
        }

        return true;
    }

    private async validateUser(
        interaction: ButtonInteraction,
        originalUserId: Snowflake
    ) {
        if (interaction.user.id !== originalUserId) {
            await interaction.reply({
                content:
                    "You cannot interact with this menu. Please create your own by using the /queue command.",
                ephemeral: true,
            });
            return false;
        }
        return true;
    }

    private async handleValidInteraction(
        interaction: ButtonInteraction,
        view: QueueView
    ) {
        if (interaction.customId === "previous-page")
            await view.setCurrentPage(view.getCurrentPage() - 1);
        else if (interaction.customId === "next-page")
            await view.setCurrentPage(view.getCurrentPage() + 1);

        const actionRow = await view.getActionRow();
        const embed = await view.getEmbed();

        await interaction.update({ components: [actionRow], embeds: [embed] });
    }

    async run(interaction: ChatInputCommandInteraction) {
        if (!(await this.validatePreconditions(interaction))) {
            return;
        }

        await interaction.deferReply();

        const player = musicPlayers.get(interaction.guildId!)!;
        const view = new QueueView(player);
        const actionRow = await view.getActionRow();
        const embed = await view.getEmbed();

        if (actionRow.components.length === 0) {
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const message = await interaction.editReply({
            components: [actionRow],
            embeds: [embed],
        });
        const collector = message.createMessageComponentCollector({
            time: 60_000,
        });

        const originalUserId = interaction.user.id;

        collector.on("collect", async (interaction: ButtonInteraction) => {
            if (
                !(await this.validateUser(interaction, originalUserId)) ||
                !(await this.validatePreconditions(interaction))
            )
                return;

            await this.handleValidInteraction(interaction, view);
        });
    }
}
