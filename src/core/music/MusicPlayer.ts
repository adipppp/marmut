import {
    Colors,
    EmbedBuilder,
    SendableChannels,
    Snowflake,
    TextBasedChannel,
} from "discord.js";
import { Player } from "shoukaku";
import { lavalinkClient, marmut, prisma } from "../client";
import { RepeatMode } from "../../enums";
import { MusicPlayerErrorCode } from "../../enums/MusicPlayerErrorCode";
import { MusicPlayerError } from "../../errors";
import { Song } from "./Song";
import { createNowPlayingEmbed } from "../../utils/functions";

const ERROR_EMOJI = process.env.ERROR_EMOJI;
const MARMUT_ICON_40PX = process.env.MARMUT_ICON_40PX;
const VIDEO_URL_REGEX =
    /https?:\/\/(?:(?:www\.)?youtube\.com\/watch\?(?:[a-zA-Z]+=.*&)*v=|youtu\.be\/)([^&]+)/;

export class MusicPlayer {
    private readonly guildId: Snowflake;
    private songIdArray: bigint[];
    private currentIndex: number;
    private repeatMode: RepeatMode;
    private textChannelId?: Snowflake;

    constructor(guildId: Snowflake, player: Player) {
        this.guildId = guildId;
        this.songIdArray = [];
        this.currentIndex = -1;
        this.repeatMode = RepeatMode.Off;

        player.on("end", async () => {
            try {
                await this.handlePlayerEnd();
            } catch (err) {
                await this.handleError(err);
            }
        });
    }

    private async handleError(err: Error) {
        console.error(err);

        let textChannel = marmut.channels.resolve(this.textChannelId!);
        if (textChannel === null || !textChannel.isSendable()) {
            return;
        }

        const errorEmbed = this.createErrorEmbed();
        await textChannel.send({ embeds: [errorEmbed] }).catch(() => {});
    }

    private async handlePlayerEnd() {
        this.currentIndex = this.getNextIndex();

        if (this.songIdArray.length === 0) {
            this.currentIndex = -1;
        } else if (this.currentIndex >= this.songIdArray.length) {
            await this.removeAllSongs();
            this.currentIndex = -1;
        } else {
            const nextSongId = this.songIdArray[this.currentIndex];
            const nextSong = (await prisma.song.findUnique({
                select: {
                    title: true,
                    thumbnailUrl: true,
                    videoUrl: true,
                    duration: true,
                },
                where: { id: nextSongId },
            }))!;

            await this.playSong(nextSong);

            const textChannel = marmut.channels.resolve(
                this.textChannelId!
            ) as SendableChannels;
            const embed = createNowPlayingEmbed(nextSong);
            await textChannel.send({ embeds: [embed] });
        }
    }

    private createErrorEmbed() {
        return new EmbedBuilder()
            .setColor(Colors.Red)
            .setTimestamp()
            .setFooter({ text: "Marmut", iconURL: MARMUT_ICON_40PX })
            .setDescription(
                `${ERROR_EMOJI}  -  An error has occured on the music player!`
            );
    }

    private async addSong(song: Song) {
        const createdSong = await prisma.song.create({ data: song });
        this.songIdArray.push(createdSong.id);
        return createdSong;
    }

    private async removeAllSongs() {
        const songIds = this.songIdArray;
        const deletedSongs = await prisma.song.deleteMany({
            where: { id: { in: songIds } },
        });
        this.songIdArray = [];
        return deletedSongs;
    }

    private getNextIndex() {
        let nextIndex;
        if (
            this.songIdArray.length > 0 &&
            this.repeatMode === RepeatMode.Queue
        ) {
            nextIndex = (this.currentIndex + 1) % this.songIdArray.length;
        } else if (this.repeatMode !== RepeatMode.Song) {
            nextIndex = this.currentIndex + 1;
        } else {
            nextIndex = this.currentIndex;
        }

        return nextIndex;
    }

    private getVideoId(videoUrl: string) {
        const match = videoUrl.match(VIDEO_URL_REGEX);
        if (match === null) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.INVALID_VIDEO_URL,
            });
        }
        return match[1];
    }

    private async playSong(song: Song) {
        const player = lavalinkClient.players.get(this.guildId);
        if (player === undefined) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.PLAYER_NOT_FOUND,
            });
        }
        const videoId = this.getVideoId(song.videoUrl);
        await player.playTrack({ track: { identifier: videoId } });
    }

    isPlaying() {
        return this.currentIndex > -1;
    }

    async play(song: Song, channel: TextBasedChannel) {
        await this.addSong(song);
        if (this.currentIndex === -1) {
            this.currentIndex = 0;
            this.textChannelId = channel.id;
            await this.playSong(song);
        }
    }

    async stop() {
        const player = lavalinkClient.players.get(this.guildId);
        if (player === undefined) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.PLAYER_NOT_FOUND,
            });
        }
        if (this.songIdArray.length > 0) {
            await this.removeAllSongs();
        }
        await player.stopTrack();
    }

    async skip() {
        const player = lavalinkClient.players.get(this.guildId);
        if (player === undefined) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.PLAYER_NOT_FOUND,
            });
        }
        if (player.paused) {
            await player.setPaused(false);
        }
        await player.stopTrack();
    }

    async pause() {
        const player = lavalinkClient.players.get(this.guildId);
        if (player === undefined) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.PLAYER_NOT_FOUND,
            });
        }
        if (player.paused) {
            return false;
        }
        await player.setPaused(true);
        return true;
    }

    async unpause() {
        const player = lavalinkClient.players.get(this.guildId);
        if (player === undefined) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.PLAYER_NOT_FOUND,
            });
        }
        if (!player.paused) {
            return false;
        }
        await player.setPaused(false);
        return true;
    }

    async removeSong(index: number) {
        const songId = this.songIdArray[index];
        const deletedSong = await prisma.song.delete({
            where: { id: songId },
        });

        if (this.currentIndex > index) {
            this.currentIndex--;
        } else if (this.currentIndex === index) {
            await this.skip();
            this.currentIndex--;
        }

        this.songIdArray.splice(index, 1);

        return deletedSong;
    }

    getVolume() {
        const player = lavalinkClient.players.get(this.guildId);
        if (player === undefined) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.PLAYER_NOT_FOUND,
            });
        }
        return player.volume;
    }

    async setVolume(volume: number) {
        if (volume < 0 || volume > 100) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.VOLUME_OUT_OF_RANGE,
            });
        }
        const player = lavalinkClient.players.get(this.guildId);
        if (player === undefined) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.PLAYER_NOT_FOUND,
            });
        }
        await player.setGlobalVolume(volume);
    }

    getRepeatMode() {
        return this.repeatMode;
    }

    setRepeatMode(mode: RepeatMode) {
        this.repeatMode = mode;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    async getCurrentSong() {
        const songId = this.songIdArray[this.currentIndex];
        return await prisma.song.findUnique({ where: { id: songId } });
    }

    getCurrentSongPlayback() {
        const player = lavalinkClient.players.get(this.guildId);
        if (player === undefined) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.PLAYER_NOT_FOUND,
            });
        }
        return player.position;
    }

    async getQueue() {
        return await prisma.song.findMany({
            select: {
                title: true,
                thumbnailUrl: true,
                videoUrl: true,
                duration: true,
            },
            where: { id: { in: this.songIdArray } },
        });
    }

    static async create(guildId: Snowflake, player: Player) {
        const musicPlayer = new MusicPlayer(guildId, player);
        await player.setGlobalVolume(50);
        return musicPlayer;
    }
}
