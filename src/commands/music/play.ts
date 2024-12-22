import {
    ChatInputCommandInteraction,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { lavalinkClient } from "../../core/client";
import { Song } from "../../core/music";
import { musicPlayers } from "../../core/managers";
import { LavalinkErrorCode, ValidationErrorCode } from "../../enums";
import { LavalinkError, ValidationError } from "../../errors";
import { LoadType, Track } from "shoukaku";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    createAddedToQueueEmbed,
    createNowPlayingEmbed,
    getLavalinkErrorMessage,
    getValidationErrorMessage,
    getVideoId,
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

    private async getSearchResult(query: string) {
        const node = lavalinkClient.options.nodeResolver(lavalinkClient.nodes);
        if (node === undefined) {
            throw new LavalinkError({
                code: LavalinkErrorCode.NO_AVAILABLE_NODES,
            });
        }
        let identifier;
        const videoId = getVideoId(query);
        if (videoId !== null) {
            identifier = videoId;
        } else {
            identifier = `ytsearch:${query}`;
        }
        const response = await node.rest.resolve(identifier);
        return response;
    }

    private async getTrack(query: string) {
        const response = await this.getSearchResult(query);
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

    private createSong(track: Track) {
        const info = track.info;
        return new Song({
            title: info.title,
            thumbnailUrl: info.artworkUrl ?? "",
            videoUrl: info.uri ?? "",
            duration: info.length,
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
            if (err instanceof ValidationError) {
                const content = getValidationErrorMessage(err);
                interaction.reply({ content, ephemeral: true }).catch(() => {});
            }
            throw err;
        }

        await interaction.deferReply();

        const query = interaction.options.getString("song", true);

        let trackResult;
        try {
            trackResult = await this.getTrack(query);
        } catch (err) {
            if (err instanceof LavalinkError) {
                interaction
                    .editReply(getLavalinkErrorMessage(err))
                    .catch(() => {});
            }
            throw err;
        }

        const member = interaction.member as GuildMember;
        const guild = interaction.guild!;

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            await joinVoiceChannel(member.voice.channel!);
        }

        const guildId = guild.id;
        const player = musicPlayers.get(guildId)!;
        const song = this.createSong(trackResult);
        const currentIndex = player.getCurrentIndex();

        try {
            await player.play(song, interaction.channel!);
        } catch (err) {
            interaction
                .editReply("Bot is not connected to any voice channel.")
                .catch(() => {});
            throw err;
        }

        const embed = this.createEmbed(song, currentIndex);
        await interaction.editReply({ embeds: [embed] });
    }
}
