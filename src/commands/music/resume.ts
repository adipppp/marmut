import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientInVoiceChannelOf,
    getValidationErrorMessage,
    inVoiceChannel,
} from "../../utils/functions";
import { Song } from "../../core/music";
import { musicPlayers } from "../../core/managers";
import { ValidationError, ValidationErrorCode } from "../../errors";

export class ResumeCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 1;
        this.data = new SlashCommandBuilder()
            .setName("resume")
            .setDescription("Resumes the music player.")
            .setDMPermission(false);
    }

    private validatePreconditions(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!inVoiceChannel(member)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_VOICE,
            });
        }

        if (!clientInVoiceChannelOf(guild)) {
            throw new ValidationError({
                code: ValidationErrorCode.CLIENT_NOT_IN_VOICE,
            });
        }

        if (!clientInSameVoiceChannelAs(member)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE,
            });
        }
    }

    private createEmbed(song: Song) {
        return new EmbedBuilder()
            .setColor(Colors.Red)
            .setTimestamp()
            .setThumbnail(song.thumbnailUrl)
            .setFooter({ text: "Dek Depe" })
            .setDescription(
                `:arrow_forward:  -  Now Playing\n[${song.title}](${song.videoUrl})`
            );
    }

    async run(interaction: ChatInputCommandInteraction) {
        try {
            this.validatePreconditions(interaction);
        } catch (err) {
            console.error(err);
            if (err instanceof ValidationError) {
                const content = getValidationErrorMessage(err);
                await interaction.reply({ content, ephemeral: true });
            }
            return;
        }

        const player = musicPlayers.get(interaction.guildId!)!;

        if (!player.isPlaying()) {
            await interaction.reply({
                content: "There is no song playing.",
                ephemeral: true,
            });
            return;
        }

        if (!player.unpause()) {
            await interaction.reply({
                content: "Music player is already playing.",
                ephemeral: true,
            });
            return;
        }

        const currentSong = (await player.getCurrentSong())!;
        const embed = this.createEmbed(currentSong);

        await interaction.reply({ embeds: [embed] });
    }
}
