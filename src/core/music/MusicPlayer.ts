import {
    AudioPlayerStatus,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
} from "@discordjs/voice";
import { marmut, prisma } from "../client";
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
    private textChannelId?: Snowflake;

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

    private async handleIdleState() {
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

            const channel = marmut.channels.cache.get(
                this.textChannelId!
            ) as TextBasedChannel;

            await this.playSong(nextSong);

            const embed = this.createEmbed(nextSong);
            await channel.send({ embeds: [embed] });
        }
    }

    private async playSong(song: Song) {
        const audioPlayer = this.getAudioPlayer();
        if (!audioPlayer) {
            throw new Error("Voice connection has not been established.");
        }

        const stream = this.getAudioStream(song.videoUrl);
        const resource = createAudioResource(stream, {
            inlineVolume: true,
        });
        resource.volume!.setVolume(this.volume / 100);

        audioPlayer.play(resource);
    }

    private getAudioStream(url: string) {
        const dlChunkSize = process.env.DL_CHUNK_SIZE
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

            audioPlayer.on("error", (err) => {
                console.error(err);
                this.currentIndex = this.songIdArray.length;
            });

            audioPlayer.on(
                AudioPlayerStatus.Idle,
                async () => await this.handleIdleState()
            );

            connection.subscribe(audioPlayer);
        }

        return audioPlayer;
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
        if (!audioPlayer) {
            throw new Error("Voice connection has not been established.");
        }

        audioPlayer.unpause();

        return audioPlayer.stop();
    }

    pause(interpolateSilence?: boolean) {
        const audioPlayer = this.getAudioPlayer();
        if (!audioPlayer) {
            throw new Error("Voice connection has not been established.");
        }
        return audioPlayer.pause(interpolateSilence);
    }

    unpause() {
        const audioPlayer = this.getAudioPlayer();
        if (!audioPlayer) {
            throw new Error("Voice connection has not been established.");
        }
        return audioPlayer.unpause();
    }

    async removeSong(index: number) {
        const songId = this.songIdArray[index];
        const deletedSong = await prisma.song.delete({
            where: { id: songId },
        });

        if (this.currentIndex > index) {
            this.currentIndex--;
        } else if (this.currentIndex === index) {
            this.skip();
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
            !audioPlayer ||
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
