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
import { RepeatMode } from "../../enums";

export class MusicPlayer {
    private readonly guildId: Snowflake;
    private songIdArray: bigint[];
    private currentIndex: number;
    private volume: number;
    private repeatMode: RepeatMode;

    constructor(guildId: Snowflake) {
        this.guildId = guildId;
        this.songIdArray = [];
        this.currentIndex = -1;
        this.volume = 50;
        this.repeatMode = RepeatMode.Off;
    }

    private async addSong(song: Song) {
        const createdSong = await prisma.song.create({ data: song });
        this.songIdArray.push(createdSong.id);

        if (this.currentIndex === -1) {
            this.currentIndex = 0;
        }

        return createdSong;
    }

    private async removeAllSongs() {
        const songIds = this.songIdArray;
        const deletedSongs = await prisma.song.deleteMany({
            where: { id: { in: songIds } },
        });

        this.songIdArray = [];
        this.currentIndex = -1;

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

        let audioPlayer;
        let subscription = connection.state.subscription;

        if (subscription) {
            audioPlayer = subscription.player;
        } else {
            audioPlayer = createAudioPlayer();
            connection.subscribe(audioPlayer);
        }

        return audioPlayer;
    }

    private getAudioStream(url: string) {
        const dlChunkSize =
            process.env.DL_CHUNK_SIZE !== undefined
                ? 1024 * 1024 * parseInt(process.env.DL_CHUNK_SIZE)
                : undefined;
        const stream = ytdl(url, {
            dlChunkSize,
            filter: "audioonly",
            quality: "highestaudio",
        });
        stream.once("error", (err) => {
            console.error(err);
            stream.destroy();
        });

        return stream;
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

    private handleCurrentIndexChange() {
        if (
            this.repeatMode === RepeatMode.Queue &&
            this.songIdArray.length > 0
        ) {
            this.currentIndex = ++this.currentIndex % this.songIdArray.length;
        } else if (this.repeatMode !== RepeatMode.Song) {
            this.currentIndex++;
        }
    }

    private async handleIdleState(channel: TextBasedChannel) {
        this.handleCurrentIndexChange();

        if (this.songIdArray.length === 0) {
            this.currentIndex = -1;
        } else if (this.currentIndex >= this.songIdArray.length) {
            await this.removeAllSongs();
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

            await this.play(nextSong, channel);

            const embed = this.createEmbed(nextSong);
            await channel.send({ embeds: [embed] });
        }
    }

    isIdle() {
        const audioPlayer = this.getAudioPlayer();
        if (audioPlayer === null) {
            throw new Error("Voice connection has not been established.");
        }
        return audioPlayer.state.status === AudioPlayerStatus.Idle;
    }

    async play(song: Song, channel: TextBasedChannel) {
        const audioPlayer = this.getAudioPlayer();
        if (audioPlayer === null) {
            throw new Error("Voice connection has not been established.");
        }

        if (
            this.currentIndex === -1 ||
            audioPlayer.state.status !== AudioPlayerStatus.Idle
        ) {
            await this.addSong(song);
        }

        if (audioPlayer.state.status === AudioPlayerStatus.Idle) {
            const stream = this.getAudioStream(song.videoUrl);
            const resource = createAudioResource(stream, {
                inlineVolume: true,
            });
            resource.volume!.setVolume(this.volume / 100);

            audioPlayer.once("error", (err) => {
                console.error(err);
                this.currentIndex = this.songIdArray.length;
            });

            audioPlayer.once(AudioPlayerStatus.Idle, async () => {
                await this.handleIdleState(channel);
            });

            audioPlayer.play(resource);
        }
    }

    async stop(force?: boolean) {
        await this.removeAllSongs();
        const audioPlayer = this.getAudioPlayer();
        const stream = this.getAudioResource()?.playStream;
        const retval = audioPlayer !== null && audioPlayer.stop(force);
        stream?.destroy();
        return retval;
    }

    skip() {
        const audioPlayer = this.getAudioPlayer();
        if (audioPlayer === null) {
            throw new Error("Voice connection has not been established.");
        }

        audioPlayer.unpause();

        return audioPlayer.stop();
    }

    pause(interpolateSilence?: boolean) {
        const audioPlayer = this.getAudioPlayer();
        if (audioPlayer === null) {
            throw new Error("Voice connection has not been established.");
        }
        return audioPlayer.pause(interpolateSilence);
    }

    unpause() {
        const audioPlayer = this.getAudioPlayer();
        if (audioPlayer === null) {
            throw new Error("Voice connection has not been established.");
        }
        return audioPlayer.unpause();
    }

    async removeSong(index: number) {
        const songId = this.songIdArray[index];
        const deletedSong = await prisma.song.delete({
            where: { id: songId },
        });

        if (this.currentIndex >= index) {
            if (this.currentIndex === index) {
                this.skip();
            }
            this.currentIndex--;
        }

        this.songIdArray.splice(index, 1);

        return deletedSong;
    }

    getVolume() {
        return this.volume;
    }

    setVolume(volume: number) {
        this.volume = Math.trunc(volume);

        const audioPlayer = this.getAudioPlayer();
        if (
            audioPlayer === null ||
            audioPlayer.state.status === AudioPlayerStatus.Idle
        ) {
            return;
        }

        const resource = audioPlayer.state.resource;
        resource.volume!.setVolume(volume / 100);
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

    getAudioResource() {
        const audioPlayer = this.getAudioPlayer();
        if (
            audioPlayer &&
            audioPlayer.state.status !== AudioPlayerStatus.Idle
        ) {
            return audioPlayer.state.resource;
        } else {
            return null;
        }
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
}
