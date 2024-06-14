import {
    AudioPlayerStatus,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
} from "@discordjs/voice";
import { prisma } from "../client";
import { Song } from "./Song";
import { Colors, EmbedBuilder, Snowflake, TextBasedChannel } from "discord.js";
import ytdl from "@distube/ytdl-core";

export class MusicPlayer {
    private readonly guildId: Snowflake;
    private songIdArray: bigint[];
    private _currentIndex: number;
    private _volume: number;

    constructor(guildId: Snowflake) {
        this.guildId = guildId;
        this.songIdArray = [];
        this._currentIndex = -1;
        this._volume = 50;
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
            return null;
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

    private createEmbed(song: Song) {
        return new EmbedBuilder()
            .setColor(Colors.Red)
            .setTimestamp()
            .setThumbnail(song.thumbnailUrl)
            .setFooter({ text: "Marmut" })
            .setDescription(
                `:arrow_forward:  -  Now Playing\n[${song.title}](${song.videoUrl})`
            );
    }

    private async handleIdleState(channel: TextBasedChannel | null) {
        if (++this._currentIndex >= this.songIdArray.length) {
            await this.removeAllSongs();
        } else {
            const nextSongId = this.songIdArray[this._currentIndex];
            const nextSong = (await prisma.song.findUnique({
                select: {
                    title: true,
                    thumbnailUrl: true,
                    videoUrl: true,
                    duration: true,
                },
                where: { id: nextSongId },
            }))!;

            await this.play(nextSong, channel);

            const embed = this.createEmbed(nextSong);
            await channel?.send({ embeds: [embed] });
        }
    }

    isPlaying() {
        const player = this.getAudioPlayer();
        return (
            player !== null && player.state.status !== AudioPlayerStatus.Idle
        );
    }

    getPlayStream() {
        const player = this.getAudioPlayer();
        if (player && player.state.status !== AudioPlayerStatus.Idle) {
            return player.state.resource.playStream;
        } else {
            return null;
        }
    }

    async play(song: Song, channel: TextBasedChannel | null) {
        const player = this.getAudioPlayer();
        if (!player) {
            throw new Error("Voice connection is not established.");
        }

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
            resource.volume!.setVolume(this._volume / 100);

            stream.once("error", (error) => {
                console.error(error);
                stream.destroy(error);
            });

            player.once("error", (error) => {
                console.error(error);
                player.stop();
                stream.destroy();
            });

            player.once(AudioPlayerStatus.Idle, async () => {
                await this.handleIdleState(channel);
            });

            player.play(resource);
        }

        await this.addSong(song);
    }

    async stop(force?: boolean) {
        await this.removeAllSongs();
        const player = this.getAudioPlayer();
        return player !== null && player.stop(force);
    }

    skip() {
        const player = this.getAudioPlayer();
        if (!player) {
            throw new Error("Voice connection is not established.");
        }
        player.unpause();
        return player.stop();
    }

    setVolume(volume: number) {
        this._volume = Math.trunc(volume);
        const player = this.getAudioPlayer();
        if (!player || player.state.status === AudioPlayerStatus.Idle) {
            return;
        }
        const resource = player.state.resource;
        resource.volume!.setVolume(volume / 100);
    }

    get currentIndex() {
        return this._currentIndex;
    }

    get volume() {
        return this._volume;
    }
}
