import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    Events,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
    Snowflake,
    VoiceBasedChannel,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    inVoiceChannel,
} from "../../utils/functions";
import YouTube, { Video } from "youtube-sr";
import { joinVoiceChannel } from "@discordjs/voice";
import { Song } from "../../core/music";
import { SearchView } from "../../views";
import { musicPlayers } from "../../core/managers";
import EventEmitter, { once } from "events";

export class SearchCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 3;
        this.data = new SlashCommandBuilder()
            .setName("search")
            .setDescription("Searches for songs to play.")
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
        const member = interaction.member as GuildMember;

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

    private joinVoiceChannel(voiceChannel: VoiceBasedChannel) {
        const guild = voiceChannel.guild;
        const guildId = guild.id;
        const channelId = voiceChannel.id;
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
        await interaction.deferReply();

        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            this.joinVoiceChannel(member.voice.channel!);
            const client = interaction.client as unknown;
            await once(client as EventEmitter, Events.VoiceStateUpdate);
        }

        const guildId = guild.id;
        const player = musicPlayers.get(guildId)!;

        const customIdInt = parseInt(interaction.customId);
        const song = songs[customIdInt - 1];

        const currentIndex = player.getCurrentIndex();
        const embed = this.createPlayingEmbed(song, currentIndex);

        try {
            await player.play(song, interaction.channel!);
        } catch (err) {
            await interaction.editReply(
                "Bot is not connected to any voice channel."
            );
            throw err;
        }

        await interaction.editReply({ embeds: [embed] });
    }

    async run(interaction: ChatInputCommandInteraction) {
        if (!(await this.validatePreconditions(interaction))) {
            return;
        }

        await interaction.deferReply();

        const query = interaction.options.getString("query", true);
        const results = await YouTube.search(query, {
            limit: 10,
            type: "video",
        });

        if (results.length === 0) {
            await interaction.editReply("Search results returned nothing.");
            return;
        }

        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            this.joinVoiceChannel(member.voice.channel!);
            const client = interaction.client as unknown;
            await once(client as EventEmitter, Events.VoiceStateUpdate);
        }

        const songs = this.createSongs(results);
        const view = new SearchView(songs);

        const rows = view.getActionRows();
        const searchMenu = view.getEmbed();

        const message = await interaction.editReply({
            components: rows,
            embeds: [searchMenu],
        });
        const collector = message.createMessageComponentCollector({
            time: 60_000,
        });

        const originalUserId = interaction.user.id;

        collector.on("collect", async (interaction: ButtonInteraction) => {
            try {
                if (
                    !(await this.validateUser(interaction, originalUserId)) ||
                    !(await this.validatePreconditions(interaction))
                )
                    return;

                collector.stop();

                rows.forEach((row) =>
                    row.components.forEach((button) => button.setDisabled(true))
                );

                await interaction.message.edit({ components: rows });

                if (await this.validatePreconditions(interaction)) {
                    await this.handleValidInteraction(interaction, songs);
                }
            } catch (err) {
                console.error(err);
            }
        });
    }
}
