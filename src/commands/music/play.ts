import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { LoadType, Track } from "shoukaku";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS } from "../../config";
import { Song } from "../../core/music";
import { LavalinkErrorCode, ValidationErrorCode } from "../../enums";
import { LavalinkError, ValidationError } from "../../errors";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    createAddedToQueueEmbed,
    createNowPlayingEmbed,
    getSearchResults,
    inVoiceChannel,
    joinVoiceChannel,
} from "../../utils/functions";
import { getGuildMusicPlayer, getMusicCommandContext } from "./context";

export class PlayCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.DEFAULT;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Plays a song.")
            .setContexts(InteractionContextType.Guild)
            .addStringOption((builder) =>
                builder
                    .setName("song")
                    .setDescription(
                        "The song to play. Can also be a YouTube video URL.",
                    )
                    .setRequired(true),
            );
    }

    private validatePreconditions(
        interaction: ChatInputCommandInteraction,
    ): void {
        const { guild, member } = getMusicCommandContext(interaction);

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

    private async getTrack(query: string): Promise<Track> {
        const response = await getSearchResults(query);
        if (
            response === undefined ||
            (response.loadType !== LoadType.TRACK &&
                response.loadType !== LoadType.SEARCH) ||
            (response.loadType === LoadType.SEARCH &&
                response.data.length === 0)
        ) {
            throw new LavalinkError({
                code: LavalinkErrorCode.TRACK_NOT_FOUND,
            });
        }
        if (response.loadType === LoadType.SEARCH) {
            return response.data[0];
        } else {
            return response.data;
        }
    }

    private createSong(track: Track): Song {
        const info = track.info;
        return new Song({
            title: info.title,
            thumbnailUrl: info.artworkUrl ?? "",
            videoUrl: info.uri ?? "",
            duration: BigInt(info.length),
        });
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            this.validatePreconditions(interaction);
        } catch (err) {
            await this.handleError(interaction, err);
            throw err;
        }

        await interaction.deferReply();

        const query = interaction.options.getString("song", true);

        let trackResult: Track;
        try {
            trackResult = await this.getTrack(query);
        } catch (err) {
            if (err instanceof Error) {
                await interaction.editReply(err.message).catch(this.logError);
            }
            throw err;
        }

        const { guild, member } = getMusicCommandContext(interaction);

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            await joinVoiceChannel(member.voice.channel!);
        }

        const player = getGuildMusicPlayer(guild.id);
        const song = this.createSong(trackResult);
        const currentIndex = player.getCurrentIndex();

        try {
            await player.play(song, interaction.channel!);
        } catch (err) {
            await interaction
                .editReply("Bot is not connected to any voice channel.")
                .catch(this.logError);
            throw err;
        }

        const embed =
            currentIndex === -1
                ? createNowPlayingEmbed(song)
                : createAddedToQueueEmbed(song);
        await interaction.editReply({ embeds: [embed] });
    }
}
