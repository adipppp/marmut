import {
    ChatInputCommandInteraction,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import YouTube, { Video } from "youtube-sr";
import { Song } from "../../core/music";
import { musicPlayers } from "../../core/managers";
import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    createAddedToQueueEmbed,
    createNowPlayingEmbed,
    getValidationErrorMessage,
    inVoiceChannel,
    joinVoiceChannel,
} from "../../utils/functions";

export class PlayCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 3;
        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Plays a song.")
            .setDMPermission(false)
            .addStringOption((builder) =>
                builder
                    .setName("song")
                    .setDescription(
                        "The song to play. Can also be a YouTube video URL."
                    )
                    .setRequired(true)
            );
    }

    private validatePreconditions(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!inVoiceChannel(member)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_VOICE,
            });
        }

        const clientInSameVoiceChannelAsMember =
            clientInSameVoiceChannelAs(member);

        if (!clientInSameVoiceChannelAsMember && clientIsPlayingIn(guild)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE,
            });
        }

        const voiceChannel = member.voice.channel!;

        if (!clientInSameVoiceChannelAsMember && !voiceChannel.joinable) {
            throw new ValidationError({
                code: ValidationErrorCode.NON_JOINABLE_VOICE_CHANNEL,
            });
        }
    }

    private async getVideo(query: string) {
        if (YouTube.validate(query, "VIDEO")) {
            return await YouTube.getVideo(query);
        } else {
            return await YouTube.searchOne(query);
        }
    }

    private createSong(video: Video) {
        return new Song({
            title: video.title!,
            thumbnailUrl: video.thumbnail!.url!,
            videoUrl: video.url,
            duration: video.duration!,
        });
    }

    private createEmbed(song: Song, currentIndex: number) {
        if (currentIndex === -1) {
            return createNowPlayingEmbed(song);
        } else {
            return createAddedToQueueEmbed(song);
        }
    }

    async run(interaction: ChatInputCommandInteraction) {
        try {
            this.validatePreconditions(interaction);
        } catch (err) {
            if (!(err instanceof ValidationError)) {
                throw err;
            }
            const content = getValidationErrorMessage(err);
            await interaction.reply({ content, ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const query = interaction.options.getString("song", true);
        const result = await this.getVideo(query);

        if (!result) {
            await interaction.editReply("Could not find the song.");
            return;
        }

        const member = interaction.member as GuildMember;
        const guild = interaction.guild!;

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            await joinVoiceChannel(member.voice.channel!);
        }

        const guildId = guild.id;
        const player = musicPlayers.get(guildId)!;
        const song = this.createSong(result);
        const currentIndex = player.getCurrentIndex();

        try {
            await player.play(song, interaction.channel!);
        } catch (err) {
            await interaction.editReply(
                "Bot is not connected to any voice channel."
            );
            throw err;
        }

        const embed = this.createEmbed(song, currentIndex);
        await interaction.editReply({ embeds: [embed] });
    }
}
