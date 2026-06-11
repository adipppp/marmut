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
import { LavalinkErrorCode } from "../../enums";
import { LavalinkError, ValidationError } from "../../errors";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    createAddedToQueueEmbed,
    createNowPlayingEmbed,
    getSearchResults,
    joinVoiceChannel,
} from "../../utils/functions";
import { validateVoiceState } from "../../utils/validators";
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
            encoded: track.encoded,
        });
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            validateVoiceState(interaction, {
                requireNotPlayingElsewhere: true,
                requireJoinableChannel: true,
            });
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
            await this.handleError(interaction, err);
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
            await this.handleError(interaction, err);
            if (!(err instanceof ValidationError)) {
                throw err;
            }
        }

        const embed =
            currentIndex === -1
                ? createNowPlayingEmbed(song)
                : createAddedToQueueEmbed(song);
        await interaction.editReply({ embeds: [embed] });
    }
}
