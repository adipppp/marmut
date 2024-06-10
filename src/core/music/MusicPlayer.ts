import {
    AudioPlayerStatus,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
} from "@discordjs/voice";
import { prisma } from "../client";
import { Song } from "./Song";
import { Snowflake } from "discord.js";
import ytdl from "@distube/ytdl-core";

export class MusicPlayer {
    private readonly guildId: Snowflake;
    private songIdArray: bigint[];
    private _currentIndex: number;

    constructor(guildId: Snowflake) {
        this.guildId = guildId;
        this.songIdArray = [];
        this._currentIndex = -1;
    }

    private async addSong(song: Song) {
        const createdSong = await prisma.song.create({ data: song });
        this.songIdArray.push(createdSong.id);

        if (this._currentIndex === -1) {
            this._currentIndex = 0;
        }

        return createdSong;
    }

    private async removeSong(index: number) {
        const songId = this.songIdArray[index];
        const deletedSong = await prisma.song.delete({
            where: { id: songId },
        });

        this.songIdArray.splice(index, 1);

        if (this.songIdArray.length <= index) {
            this._currentIndex = -1;
        }

        return deletedSong;
    }

    private async removeAllSongs() {
        const songIds = this.songIdArray;
        const deletedSongs = await prisma.song.deleteMany({
            where: { id: { in: songIds } },
        });

        this.songIdArray = [];
        this._currentIndex = -1;

        return deletedSongs;
    }

    private getAudioPlayer() {
        const connection = getVoiceConnection(this.guildId);
        if (
            !connection ||
            connection.state.status === VoiceConnectionStatus.Destroyed
        ) {
            throw new Error(
                `Voice connection with guildId: ${this.guildId} doesn't exist`
            );
        }

        let player;
        let subscription = connection.state.subscription;

        if (subscription) {
            player = subscription.player;
        } else {
            player = createAudioPlayer();
            connection.subscribe(player);
        }

        return player;
    }

    private async handleIdleState() {
        if (++this._currentIndex >= this.songIdArray.length) {
            this.removeAllSongs();
        } else {
            const nextSongId = this.songIdArray[this._currentIndex];
            const nextSong = (await prisma.song.findUnique({
                select: {
                    title: true,
                    thumbnailUrl: true,
                    videoUrl: true,
                    duration: true,
                    volume: true,
                },
                where: { id: nextSongId },
            }))!;
            this.play(nextSong);
        }
    }

    isPlaying() {
        const player = this.getAudioPlayer();
        return player.state.status !== AudioPlayerStatus.Idle;
    }

    getPlayStream() {
        const player = this.getAudioPlayer();
        if (player.state.status !== AudioPlayerStatus.Idle) {
            return player.state.resource.playStream;
        } else {
            return null;
        }
    }

    async play(song: Song) {
        const player = this.getAudioPlayer();

        if (player.state.status === AudioPlayerStatus.Idle) {
            const dlChunkSize = process.env.DL_CHUNK_SIZE
                ? 1024 * 1024 * parseInt(process.env.DL_CHUNK_SIZE)
                : undefined;
            const stream = ytdl(song.videoUrl, {
                dlChunkSize,
                filter: "audioonly",
                quality: "highestaudio",
            });
            const resource = createAudioResource(stream, {
                inlineVolume: true,
            });
            resource.volume!.setVolume(song.volume / 100);

            stream.once("error", (error) => {
                console.error(error);
                stream.destroy(error);
            });

            player.once("error", (error) => {
                console.error(error);
                player.stop();
                stream.destroy();
            });

            player.once(
                AudioPlayerStatus.Idle,
                this.handleIdleState.bind(this)
            );

            player.play(resource);
        }

        await this.addSong(song);
    }

    stop(force?: boolean) {
        const player = this.getAudioPlayer();
        return player.stop(force);
    }

    get currentIndex() {
        return this._currentIndex;
    }
}
