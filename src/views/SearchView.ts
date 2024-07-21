import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
} from "discord.js";
import { Song } from "../core/music";

const NUMBER_EMOJIS = [
    ":one:",
    ":two:",
    ":three:",
    ":four:",
    ":five:",
    ":six:",
    ":seven:",
    ":eight:",
    ":nine:",
    ":keycap_ten:",
];

export class SearchView {
    private readonly actionRows: ActionRowBuilder<ButtonBuilder>[];
    private readonly embed: EmbedBuilder;

    constructor(songs: Song[]) {
        this.actionRows = this.createActionRows(songs);
        this.embed = this.createEmbed(songs);
    }

    private createButton(index: number) {
        return new ButtonBuilder()
            .setCustomId((index + 1).toString())
            .setLabel((index + 1).toString())
            .setStyle(ButtonStyle.Success);
    }

    private createDescription(songs: Song[]) {
        if (songs.length === 0) {
            return "";
        }

        let desc = `${NUMBER_EMOJIS[0].padEnd(8)}[${songs[0].title}](${
            songs[0].videoUrl
        })`;

        for (let i = 1; i < songs.length; i++) {
            const song = songs[i];
            desc += `\n\n[${NUMBER_EMOJIS[i].padEnd(8)}${song.title}](${
                song.videoUrl
            })`;
        }

        return desc;
    }

    private createActionRow(songs: Song[], start: number) {
        const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder();
        let j = start;
        for (let i = 0; i < songs.length; i++) {
            const button = this.createButton(j++);
            row.addComponents(button);
        }
        return row;
    }

    private createActionRows(songs: Song[]) {
        const actionRows = [];
        const actionRow1 = this.createActionRow(songs.slice(0, 5), 0);
        actionRows.push(actionRow1);
        if (songs.length > 5) {
            const actionRow2 = this.createActionRow(songs.slice(5, 10), 5);
            actionRows.push(actionRow2);
        }
        return actionRows;
    }

    private createEmbed(songs: Song[]) {
        const desc = this.createDescription(songs);
        return new EmbedBuilder().setColor(Colors.Red).setDescription(desc);
    }

    getActionRows() {
        return this.actionRows;
    }

    getEmbed() {
        return this.embed;
    }
}
