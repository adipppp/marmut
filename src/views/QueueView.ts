import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
} from "discord.js";
import { MusicPlayer } from "../core/music";

export class QueueView {
    private readonly player: MusicPlayer;
    private readonly embed: EmbedBuilder;
    private readonly previousButton: ButtonBuilder;
    private readonly nextButton: ButtonBuilder;
    private readonly actionRow: ActionRowBuilder<ButtonBuilder>;
    private currentPage: number;

    constructor(player: MusicPlayer) {
        this.player = player;
        this.embed = new EmbedBuilder();
        this.previousButton = this.createPreviousButton();
        this.nextButton = this.createNextButton();
        this.actionRow = new ActionRowBuilder();
        this.currentPage = 1;
    }

    private createPreviousButton() {
        return new ButtonBuilder()
            .setCustomId("previous-page")
            .setEmoji({ name: "⬅" })
            .setStyle(ButtonStyle.Success);
    }

    private createNextButton() {
        return new ButtonBuilder()
            .setCustomId("next-page")
            .setEmoji({ name: "➡️" })
            .setStyle(ButtonStyle.Success);
    }

    private millisecondsToHHMMSS(ms: number) {
        if (Math.trunc(ms) !== ms) {
            throw new Error("seconds must be an integer");
        }

        if (ms > 86400000) {
            throw new Error("Cannot convert more than 24 hours");
        }

        let seconds = Math.trunc(ms / 1000);
        let minutes = Math.trunc(seconds / 60);
        seconds = seconds % 60;
        const hours = Math.trunc(minutes / 60);
        minutes = minutes % 60;

        const secondsString = seconds.toString().padStart(2, "0");
        const minutesString = minutes.toString().padStart(2, "0");
        const hoursString = hours.toString().padStart(2, "0");

        return `${hoursString}:${minutesString}:${secondsString}`;
    }

    getCurrentPage() {
        return this.currentPage;
    }

    async setCurrentPage(page: number) {
        if (Math.trunc(page) !== page) {
            throw new Error("Page number must be an integer");
        }

        if (page < 1) {
            throw new Error("Page number cannot be less than 1");
        }

        const queue = await this.player.getQueue();

        if (page > Math.ceil(queue.length / 5)) {
            this.currentPage = Math.ceil(queue.length / 5);
        } else {
            this.currentPage = page;
        }
    }

    async getActionRow() {
        const queue = await this.player.getQueue();

        this.actionRow.setComponents([]);

        if (this.currentPage > 1) {
            this.actionRow.addComponents(this.previousButton);
        }
        if (this.currentPage < Math.ceil(queue.length / 5)) {
            this.actionRow.addComponents(this.nextButton);
        }

        return this.actionRow;
    }

    async getEmbed() {
        const queue = await this.player.getQueue();
        const currentPage = this.currentPage;

        const currentSongIndex = this.player.getCurrentIndex();
        const currentSong = queue[currentSongIndex];

        const currentSongPlayback =
            this.player.getAudioResource()!.playbackDuration;
        const formattedDuration =
            this.millisecondsToHHMMSS(currentSongPlayback);

        const embed = this.embed
            .setColor(Colors.Red)
            .setTitle(":arrow_forward:  -  Now Playing")
            .setDescription(
                `[${currentSong.title} - ${formattedDuration}](${currentSong.videoUrl})`
            )
            .setThumbnail(currentSong.thumbnailUrl);

        if (queue.length <= 1) return embed;

        const lowerIndex = (currentPage - 1) * 5;
        const songs = queue.slice(lowerIndex, lowerIndex + 5);

        let value = "";

        for (let i = 0; i < songs.length; i++) {
            value += `[${i + lowerIndex + 1}. ${songs[i].title}](${
                songs[i].videoUrl
            })`;
            if (i < songs.length - 1) {
                value += "\n";
            }
        }

        embed.setFields({ name: "In queue", value });

        return embed;
    }
}
