import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientInVoiceChannelOf,
    inVoiceChannel,
} from "../../utils/functions";
import { musicPlayers } from "../../core/music";

export class PauseCommand implements Command {
    readonly data: SlashCommandOptionsOnlyBuilder;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("pause")
            .setDescription("Pauses the music player.");
    }

    private async validatePreconditions(
        interaction: ChatInputCommandInteraction
    ) {
        const guild = interaction.guild!;
        const member = guild.members.cache.get(interaction.user.id)!;

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

        return true;
    }

    async run(interaction: ChatInputCommandInteraction) {
        if (!(await this.validatePreconditions(interaction))) {
            return;
        }

        const player = musicPlayers.get(interaction.guildId!);

        if (!player || !player.isPlaying()) {
            await interaction.reply({
                content: "There is no song playing.",
                ephemeral: true,
            });
            return;
        }

        const isPaused = player.pause();

        if (!isPaused) {
            await interaction.reply({
                content: "Music player is already paused.",
                ephemeral: true,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(":pause_button:  -  Music player paused");

        await interaction.reply({ embeds: [embed] });
    }
}
