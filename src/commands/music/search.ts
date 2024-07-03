import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    Snowflake,
    VoiceBasedChannel,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    createMusicPlayer,
    inVoiceChannel,
} from "../../utils/functions";
import YouTube, { Video } from "youtube-sr";
import { joinVoiceChannel } from "@discordjs/voice";
import { Song, musicPlayers } from "../../core/music";

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

export class SearchCommand implements Command {
    readonly data: SlashCommandOptionsOnlyBuilder;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("search")
            .setDescription(
                "Searches for songs to play. The menu only lasts for 60 seconds though, so be quick."
            )
            .setDMPermission(false)
            .addStringOption((builder) =>
                builder
                    .setName("query")
                    .setDescription("Something to search.")
                    .setRequired(true)
            );
    }

    private async validatePreconditions(
        interaction: ButtonInteraction | ChatInputCommandInteraction
    ) {
        const guild = interaction.guild!;
        const member = guild.members.cache.get(interaction.user.id)!;

        if (!inVoiceChannel(member)) {
            await interaction.reply({
                content:
                    "You need to be in a voice channel to use this command.",
                ephemeral: true,
            });
            return false;
        }

        if (!clientInSameVoiceChannelAs(member) && clientIsPlayingIn(guild)) {
            await interaction.reply({
                content:
                    "Bot is already playing a song in another voice channel.",
                ephemeral: true,
            });
            return false;
        }

        const channelId = member.voice.channelId!;
        const voiceChannel = guild.channels.cache.get(
            channelId
        ) as VoiceBasedChannel;

        if (!voiceChannel.joinable) {
            await interaction.reply({
                content: "Unable to connect to the voice channel.",
                ephemeral: true,
            });
            return false;
        }

        return true;
    }

    private async validateUser(
        interaction: ButtonInteraction,
        originalUserId: Snowflake
    ) {
        if (interaction.user.id !== originalUserId) {
            await interaction.reply({
                content:
                    "You cannot interact with this menu. Please create your own by using the /search command.",
                ephemeral: true,
            });
            return false;
        }
        return true;
    }

    private joinVoiceChannel(channel: VoiceBasedChannel) {
        const guild = channel.guild;
        const guildId = guild.id;
        const channelId = channel.id;
        const adapterCreator = guild.voiceAdapterCreator;

        joinVoiceChannel({ guildId, channelId, adapterCreator });
    }

    private createSongs(results: Video[]) {
        return results.map(
            (result) =>
                new Song({
                    title: result.title!,
                    thumbnailUrl: result.thumbnail!.url!,
                    videoUrl: result.url,
                    duration: result.duration!,
                })
        );
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

        let desc = `[${NUMBER_EMOJIS[0].padEnd(8)}${songs[0].title}](${
            songs[0].videoUrl
        })`;

        for (let i = 1; i < songs.length; i++) {
            const song = songs[i];
            desc += `\n[${NUMBER_EMOJIS[i].padEnd(8)}${song.title}](${
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

    private updateActionRowsWithDisabledButtons(
        rows: ActionRowBuilder<ButtonBuilder>[]
    ) {
        rows.forEach((row) =>
            row.components.forEach((button) => button.setDisabled(true))
        );
        return rows;
    }

    private createSearchMenu(songs: Song[]) {
        const desc = this.createDescription(songs);
        return new EmbedBuilder().setColor(Colors.Red).setDescription(desc);
    }

    private createPlayingEmbed(song: Song, currentIndex: number) {
        let description;
        if (currentIndex === -1) {
            description = `:arrow_forward:  -  Now Playing\n[${song.title}](${song.videoUrl})`;
        } else {
            description = `:white_check_mark:  -  Added to queue\n[${song.title}](${song.videoUrl})`;
        }

        return new EmbedBuilder()
            .setColor(Colors.Red)
            .setTimestamp()
            .setThumbnail(song.thumbnailUrl)
            .setFooter({ text: "Marmut" })
            .setDescription(description);
    }

    private async handleValidInteraction(
        interaction: ButtonInteraction,
        songs: Song[]
    ) {
        const guild = interaction.guild!;
        const guildId = guild.id;
        const member = interaction.member as GuildMember;

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            this.joinVoiceChannel(member.voice.channel!);
        }

        const customIdInt = parseInt(interaction.customId);
        const song = songs[customIdInt - 1];
        const player = musicPlayers.get(guildId) ?? createMusicPlayer(guildId);
        const currentIndex = player.getCurrentIndex();
        const embed = this.createPlayingEmbed(song, currentIndex);

        await interaction.deferReply();
        await player.play(song, interaction.channel);
        await interaction.editReply({ embeds: [embed] });
    }

    async run(interaction: ChatInputCommandInteraction) {
        if (!(await this.validatePreconditions(interaction))) {
            return;
        }

        await interaction.deferReply();

        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            this.joinVoiceChannel(member.voice.channel!);
        }

        const query = interaction.options.getString("query", true);
        const results = await YouTube.search(query, {
            limit: 10,
            type: "video",
        });

        if (results.length === 0) {
            await interaction.editReply("Search results returned nothing.");
            return;
        }

        const songs = this.createSongs(results);
        let rows = this.createActionRows(songs);
        const searchMenu = this.createSearchMenu(songs);

        const message = await interaction.editReply({
            components: rows,
            embeds: [searchMenu],
        });
        const collector = message.createMessageComponentCollector({
            time: 60_000,
        });

        const originalUserId = interaction.user.id;

        collector.on("collect", async (interaction: ButtonInteraction) => {
            if (
                !(await this.validateUser(interaction, originalUserId)) ||
                !(await this.validatePreconditions(interaction))
            )
                return;

            collector.stop();

            await this.handleValidInteraction(interaction, songs);

            rows = this.updateActionRowsWithDisabledButtons(rows);
            await interaction.message.edit({ components: rows });
        });
    }
}
