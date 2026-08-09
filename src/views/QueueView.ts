import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from "discord.js";
import { MusicPlayer, Song } from "../core/music";
import { EMBED_COLOR } from "../config";
import { millisecondsToHHMMSS } from "../utils/functions";

export class QueueView {
    private readonly player: MusicPlayer;
    private currentPage: number;
    private previousButton?: ButtonBuilder;
    private nextButton?: ButtonBuilder;
    private actionRow?: ActionRowBuilder<ButtonBuilder>;

    constructor(player: MusicPlayer) {
        this.player = player;
        this.currentPage = 1;
    }

    private createPreviousButton(): ButtonBuilder {
        return new ButtonBuilder()
            .setCustomId("previous-page")
            .setEmoji({ name: "⬅" })
            .setStyle(ButtonStyle.Success);
    }

    private createNextButton(): ButtonBuilder {
        return new ButtonBuilder()
            .setCustomId("next-page")
            .setEmoji({ name: "➡️" })
            .setStyle(ButtonStyle.Success);
    }

    private async getUpcomingSongs(): Promise<{ song: Song; index: number }[]> {
        const queue = await this.player.getQueue();
        const currentSongIndex = this.player.getCurrentIndex();
        if (currentSongIndex === -1) return [];

        return queue
            .map((song, index) => ({ song, index }))
            .slice(currentSongIndex + 1);
    }

    getCurrentPage(): number {
        return this.currentPage;
    }

    async setCurrentPage(page: number): Promise<void> {
        if (!Number.isInteger(page)) {
            throw new Error("Page number must be an integer");
        }

        const upcoming = await this.getUpcomingSongs();
        const maxPages = Math.max(1, Math.ceil(upcoming.length / 5));

        if (page > maxPages) {
            this.currentPage = maxPages;
        } else {
            this.currentPage = Math.max(1, page);
        }
    }

    async getActionRow(): Promise<ActionRowBuilder<ButtonBuilder>> {
        if (!this.actionRow) {
            this.actionRow = new ActionRowBuilder();
        }
        this.actionRow.setComponents([]);

        const upcoming = await this.getUpcomingSongs();

        if (this.currentPage > 1) {
            if (!this.previousButton) {
                this.previousButton = this.createPreviousButton();
            }
            this.actionRow.addComponents(this.previousButton);
        }
        if (this.currentPage < Math.ceil(upcoming.length / 5)) {
            if (!this.nextButton) {
                this.nextButton = this.createNextButton();
            }
            this.actionRow.addComponents(this.nextButton);
        }

        return this.actionRow;
    }

    async getEmbed(): Promise<EmbedBuilder> {
        const queue = await this.player.getQueue();
        const currentPage = this.currentPage;

        const embed = new EmbedBuilder();

        const currentSongIndex = this.player.getCurrentIndex();
        const currentSong = queue[currentSongIndex];

        if (!currentSong) return embed.setDescription("Queue is empty.");

        const currentPos = millisecondsToHHMMSS(this.player.getCurrentSongPlayback());
        const totalDuration = millisecondsToHHMMSS(Number(currentSong.duration));

        embed
            .setColor(EMBED_COLOR)
            .setTitle(":arrow_forward:  -  Now Playing")
            .setDescription(
                `[${currentSong.title} - ${currentPos} / ${totalDuration}](${currentSong.videoUrl})`,
            )
            .setThumbnail(currentSong.thumbnailUrl);

        const upcoming = await this.getUpcomingSongs();
        if (upcoming.length === 0) return embed;

        const lowerIndex = (currentPage - 1) * 5;
        const pageItems = upcoming.slice(lowerIndex, lowerIndex + 5);

        if (pageItems.length === 0) return embed;

        let value = "";
        for (let i = 0; i < pageItems.length; i++) {
            const { song } = pageItems[i];
            const itemNumber = lowerIndex + i + 1;
            value += `${itemNumber}. [${song.title}](${song.videoUrl})`;
            if (i < pageItems.length - 1) {
                value += "\n";
            }
        }

        embed.setFields({ name: "In queue", value });

        return embed;
    }
}
