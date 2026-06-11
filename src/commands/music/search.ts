import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
    Snowflake,
} from "discord.js";
import { LoadType, Track } from "shoukaku";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS, TIMEOUTS } from "../../config";
import { Song } from "../../core/music";
import { SearchView } from "../../views";
import { LavalinkErrorCode, ValidationErrorCode } from "../../enums";
import { LavalinkError, ValidationError } from "../../errors";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    createAddedToQueueEmbed,
    createNowPlayingEmbed,
    getSearchResults,
    joinVoiceChannel,
} from "../../utils/functions";
import { validateVoiceState } from "../../utils/validators";
import { getGuildMusicPlayer, getMusicCommandContext } from "./context";

export default class SearchCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.DEFAULT;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("search")
            .setDescription("Searches for songs to play.")
            .setContexts(InteractionContextType.Guild)
            .addStringOption((builder) =>
                builder
                    .setName("query")
                    .setDescription("Something to search.")
                    .setRequired(true),
            );
    }

    private validateUser(
        interaction: ButtonInteraction,
        originalUserId: Snowflake,
    ): void {
        if (interaction.user.id !== originalUserId) {
            throw new ValidationError({
                code: ValidationErrorCode.SEARCH_MENU_NOT_FOR_USER,
            });
        }
    }

    private async getTracks(query: string): Promise<Track[]> {
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

    private createSongs(results: Track[]): Song[] {
        return results.map(
            (result) =>
                new Song({
                    title: result.info.title,
                    thumbnailUrl: result.info.artworkUrl ?? "",
                    videoUrl: result.info.uri ?? "",
                    duration: BigInt(result.info.length),
                    encoded: result.encoded,
                }),
        );
    }

    private async handleValidInteraction(
        interaction: ButtonInteraction,
        songs: Song[],
    ): Promise<void> {
        await interaction.deferReply();

        const { guild, member } = getMusicCommandContext(interaction);

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            await joinVoiceChannel(member.voice.channel!);
        }

        const player = getGuildMusicPlayer(guild.id);

        const customIdInt = parseInt(interaction.customId);
        const song = songs[customIdInt - 1];

        const currentIndex = player.getCurrentIndex();
        const embed =
            currentIndex === -1
                ? createNowPlayingEmbed(song)
                : createAddedToQueueEmbed(song);

        try {
            await player.play(song, interaction.channel!);
        } catch (err) {
            await this.handleError(interaction, err);
            if (!(err instanceof ValidationError)) {
                throw err;
            }
        }

        await interaction.editReply({ embeds: [embed] });
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            validateVoiceState(interaction, {
                requireNotPlayingElsewhere: true,
                requireJoinableChannel: true,
            });
        } catch (err) {
            await this.handleError(interaction, err);
            throw err;
        }

        await interaction.deferReply();

        const query = interaction.options.getString("query", true);
        const tracks = await this.getTracks(query);

        if (tracks.length === 0) {
            await interaction.editReply("Search results returned nothing.");
            return;
        }

        const { guild, member } = getMusicCommandContext(interaction);

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
            time: TIMEOUTS.SEARCH_MENU_MS,
        });

        const originalUserId = interaction.user.id;

        collector.on(
            "collect",
            async (buttonInteraction: ButtonInteraction) => {
                try {
                    this.validateUser(buttonInteraction, originalUserId);
                    validateVoiceState(buttonInteraction, {
                        requireNotPlayingElsewhere: true,
                        requireJoinableChannel: true,
                    });

                    collector.stop();

                    rows.forEach((row) =>
                        row.components.forEach((button) =>
                            button.setDisabled(true),
                        ),
                    );

                    await buttonInteraction.message.edit({ components: rows });
                    await this.handleValidInteraction(buttonInteraction, songs);
                } catch (err) {
                    console.error(err);
                    if (err instanceof Error) {
                        await buttonInteraction
                            .reply({ content: err.message, ephemeral: true })
                            .catch(this.logError);
                    }
                }
            },
        );

        collector.on("end", async () => {
            rows.forEach((row) =>
                row.components.forEach((button) => button.setDisabled(true)),
            );
            await message.edit({ components: rows }).catch(this.logError);
        });
    }
}
