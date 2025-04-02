import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
    Snowflake,
} from "discord.js";
import { LoadType, Track } from "shoukaku";
import { Song } from "../../core/music";
import { SearchView } from "../../views";
import { musicPlayers } from "../../core/managers";
import { LavalinkErrorCode, ValidationErrorCode } from "../../enums";
import { LavalinkError, ValidationError } from "../../errors";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    createAddedToQueueEmbed,
    createNowPlayingEmbed,
    getSearchResults,
    inVoiceChannel,
    joinVoiceChannel,
} from "../../utils/functions";

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

    private validatePreconditions(
        interaction: ButtonInteraction | ChatInputCommandInteraction
    ) {
        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!inVoiceChannel(member)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_VOICE,
            });
        }

        const clientInSameVoiceChannelAsMember =
            clientInSameVoiceChannelAs(member);

        if (!clientInSameVoiceChannelAsMember && clientIsPlayingIn(guild)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE,
            });
        }

        const voiceChannel = member.voice.channel!;

        if (!clientInSameVoiceChannelAsMember && !voiceChannel.joinable) {
            throw new ValidationError({
                code: ValidationErrorCode.NON_JOINABLE_VOICE_CHANNEL,
            });
        }
    }

    private validateUser(
        interaction: ButtonInteraction,
        originalUserId: Snowflake
    ) {
        if (interaction.user.id !== originalUserId) {
            throw new ValidationError({
                code: ValidationErrorCode.SEARCH_MENU_NOT_FOR_USER,
            });
        }
    }

    private async getTracks(query: string) {
        const response = await getSearchResults(query);
        if (
            response === undefined ||
            (response.loadType !== LoadType.TRACK &&
                response.loadType !== LoadType.SEARCH) ||
            (response.loadType === LoadType.SEARCH &&
                response.data.length === 0)
        ) {
            throw new LavalinkError({
                code: LavalinkErrorCode.TRACK_NOT_FOUND,
            });
        }
        if (response.loadType === LoadType.SEARCH) {
            return response.data.slice(0, 10);
        } else {
            return [response.data];
        }
    }

    private createSongs(results: Track[]) {
        return results.map(
            (result) =>
                new Song({
                    title: result.info.title,
                    thumbnailUrl: result.info.artworkUrl ?? "",
                    videoUrl: result.info.uri ?? "",
                    duration: BigInt(result.info.length),
                })
        );
    }

    private createEmbed(song: Song, currentIndex: number) {
        if (currentIndex === -1) {
            return createNowPlayingEmbed(song);
        } else {
            return createAddedToQueueEmbed(song);
        }
    }

    private async handleValidInteraction(
        interaction: ButtonInteraction,
        songs: Song[]
    ) {
        await interaction.deferReply();

        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            await joinVoiceChannel(member.voice.channel!);
        }

        const guildId = guild.id;
        const player = musicPlayers.get(guildId)!;

        const customIdInt = parseInt(interaction.customId);
        const song = songs[customIdInt - 1];

        const currentIndex = player.getCurrentIndex();
        const embed = this.createEmbed(song, currentIndex);

        try {
            await player.play(song, interaction.channel!);
        } catch (err) {
            interaction
                .editReply("Bot is not connected to any voice channel.")
                .catch(() => {});
            throw err;
        }

        await interaction.editReply({ embeds: [embed] });
    }

    async run(interaction: ChatInputCommandInteraction) {
        try {
            this.validatePreconditions(interaction);
        } catch (err) {
            if (err instanceof Error) {
                interaction
                    .reply({ content: err.message, ephemeral: true })
                    .catch(() => {});
            }
            throw err;
        }

        await interaction.deferReply();

        const query = interaction.options.getString("query", true);
        const tracks = await this.getTracks(query);

        if (tracks.length === 0) {
            await interaction.editReply("Search results returned nothing.");
            return;
        }

        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            await joinVoiceChannel(member.voice.channel!);
        }

        const songs = this.createSongs(tracks);
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
                this.validateUser(interaction, originalUserId);
                this.validatePreconditions(interaction);

                collector.stop();

                rows.forEach((row) =>
                    row.components.forEach((button) => button.setDisabled(true))
                );

                interaction.message.edit({ components: rows });
                await this.handleValidInteraction(interaction, songs);
            } catch (err) {
                console.error(err);
                if (err instanceof Error) {
                    interaction
                        .reply({ content: err.message, ephemeral: true })
                        .catch(() => {});
                }
            }
        });
    }
}
