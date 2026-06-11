import { Colors, EmbedBuilder, Snowflake, TextBasedChannel } from "discord.js";
import { Player } from "shoukaku";
import { getLavalinkClient, getMarmutClient } from "../client";
import { guildVoiceStateManager } from "../managers";
import { MUSIC_PLAYER, env } from "../../config";
import { RepeatMode, MusicPlayerErrorCode } from "../../enums";
import { MusicPlayerError } from "../../errors";
import { createNowPlayingEmbed } from "../../utils/functions";
import { Song } from "./Song";

const { DEFAULT_VOLUME, MS_PER_SECOND } = MUSIC_PLAYER;

export class MusicPlayer {
    private readonly guildId: Snowflake;
    private readonly songs: Song[];
    private currentIndex: number;
    private repeatMode: RepeatMode;
    private textChannelId?: Snowflake;
    private isSkipping: boolean;

    constructor(guildId: Snowflake, player: Player) {
        this.guildId = guildId;
        this.songs = [];
        this.currentIndex = -1;
        this.repeatMode = RepeatMode.Off;
        this.isSkipping = false;

        player.setGlobalVolume(DEFAULT_VOLUME);

        player.on("end", async () => {
            try {
                await this.handlePlayerEnd();
            } catch (err) {
                await this.handleError(err);
            }
        });
    }

    private async handleError(err: unknown): Promise<void> {
        console.error(err);
        if (!this.textChannelId) {
            return;
        }

        const marmut = getMarmutClient();
        const textChannel = marmut.channels.resolve(this.textChannelId);
        if (textChannel === null || !textChannel.isSendable()) {
            return;
        }

        const errorEmbed = this.createErrorEmbed();
        await textChannel.send({ embeds: [errorEmbed] }).catch(console.error);
    }

    private handleGuildVoiceState(): void {
        const guildVoiceState = guildVoiceStateManager.get(this.guildId);
        if (guildVoiceState === undefined) {
            return;
        }

        if (guildVoiceState.shouldTriggerAutoDisconnectTimer()) {
            guildVoiceState.triggerAutoDisconnectTimer();
        } else if (guildVoiceState.shouldCancelAutoDisconnectTimer()) {
            guildVoiceState.cancelAutoDisconnectTimer();
        }
    }

    private async handlePlayerEnd(): Promise<void> {
        this.currentIndex = this.getNextIndex(this.isSkipping);
        this.isSkipping = false;

        if (this.songs.length === 0) {
            this.handleGuildVoiceState();
            return;
        }

        if (this.currentIndex >= this.songs.length) {
            this.currentIndex = -1;
            this.handleGuildVoiceState();
            return;
        }

        const nextSong = this.songs[this.currentIndex];
        await this.playSong(nextSong);
        this.handleGuildVoiceState();

        if (!this.textChannelId) {
            return;
        }

        const marmut = getMarmutClient();
        const textChannel = marmut.channels.resolve(this.textChannelId);
        if (textChannel === null || !textChannel.isSendable()) {
            return;
        }

        const embed = createNowPlayingEmbed(nextSong);
        await textChannel.send({ embeds: [embed] }).catch(console.error);
    }

    private createErrorEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(Colors.Red)
            .setTimestamp()
            .setFooter({ text: "Marmut", iconURL: env.ui.marmutIcon40px })
            .setDescription(
                `${env.ui.errorEmoji}  -  An error has occurred on the music player!`,
            );
    }

    private addSong(song: Song): void {
        this.songs.push(song);
    }

    private clearSongs(): void {
        this.songs.length = 0;
    }

    private getNextIndex(forceNext = false): number {
        if (this.songs.length === 0) return -1;

        if (this.repeatMode === RepeatMode.Song && !forceNext) {
            return Math.max(0, this.currentIndex);
        }

        if (this.repeatMode === RepeatMode.Queue) {
            return (this.currentIndex + 1) % this.songs.length;
        }

        return this.currentIndex + 1;
    }

    private getPlayer(): Player {
        const lavalinkClient = getLavalinkClient();
        const player = lavalinkClient.players.get(this.guildId);
        if (player === undefined) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.PLAYER_NOT_FOUND,
            });
        }
        return player;
    }

    private async playSong(song: Song): Promise<void> {
        const player = this.getPlayer();
        await player.playTrack({ track: { encoded: song.encoded } });
    }

    isPlaying(): boolean {
        return this.currentIndex > -1;
    }

    async play(song: Song, channel: TextBasedChannel): Promise<void> {
        this.addSong(song);
        this.textChannelId = channel.id;

        if (this.currentIndex !== -1) {
            return;
        }

        this.currentIndex = 0;
        try {
            await this.playSong(song);
        } catch (err) {
            console.error(err);
            this.handleError(err).catch(console.error);
            this.songs.pop();
            this.currentIndex = -1;
            throw err;
        }

        this.handleGuildVoiceState();
    }

    async stop(): Promise<void> {
        const player = this.getPlayer();
        this.clearSongs();
        this.currentIndex = -1;
        this.handleGuildVoiceState();
        await player.stopTrack();
    }

    async skip(): Promise<void> {
        const player = this.getPlayer();
        if (player.paused) {
            await player.setPaused(false);
        }
        this.isSkipping = true;
        await player.stopTrack();
    }

    async pause(): Promise<boolean> {
        const player = this.getPlayer();
        if (player.paused) {
            return false;
        }
        await player.setPaused(true);
        return true;
    }

    async unpause(): Promise<boolean> {
        const player = this.getPlayer();
        if (!player.paused) {
            return false;
        }
        await player.setPaused(false);
        return true;
    }

    async removeSong(index: number): Promise<void> {
        if (index < 0 || index >= this.songs.length) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.SONG_NOT_FOUND,
            });
        }

        this.songs.splice(index, 1);

        if (this.songs.length === 0) {
            this.currentIndex = -1;
            this.handleGuildVoiceState();
            await this.getPlayer().stopTrack();
            return;
        }

        if (this.currentIndex > index) {
            this.currentIndex--;
            return;
        }

        if (this.currentIndex === index) {
            this.currentIndex--;
            await this.skip();
            return;
        }
    }

    async seek(positionMs: number): Promise<void> {
        if (positionMs < 0 || this.currentIndex < 0) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.SEEK_POSITION_OUT_OF_RANGE,
            });
        }

        const currentSong = this.songs[this.currentIndex];
        if (BigInt(positionMs) > currentSong.duration) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.SEEK_POSITION_OUT_OF_RANGE,
            });
        }

        const player = this.getPlayer();
        await player.seekTo(positionMs);
    }

    getVolume(): number {
        const player = this.getPlayer();
        return player.volume;
    }

    async setVolume(volume: number): Promise<void> {
        if (volume < 0 || volume > 100) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.VOLUME_OUT_OF_RANGE,
            });
        }

        const player = this.getPlayer();
        await player.setGlobalVolume(volume);
    }

    getRepeatMode(): RepeatMode {
        return this.repeatMode;
    }

    setRepeatMode(mode: RepeatMode): void {
        this.repeatMode = mode;
    }

    getCurrentIndex(): number {
        return this.currentIndex;
    }

    async getCurrentSong(): Promise<Song> {
        if (this.currentIndex < 0 || this.currentIndex >= this.songs.length) {
            throw new MusicPlayerError({
                code: MusicPlayerErrorCode.SONG_NOT_FOUND,
            });
        }

        return this.songs[this.currentIndex];
    }

    getCurrentSongPlayback(): number {
        const player = this.getPlayer();
        return player.position;
    }

    async getQueue(): Promise<Song[]> {
        return [...this.songs];
    }
}
