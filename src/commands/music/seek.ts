import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS, MUSIC_PLAYER } from "../../config";
import { MusicPlayerErrorCode } from "../../enums";
import { MusicPlayerError } from "../../errors";
import { millisecondsToHHMMSS } from "../../utils/functions";
import {
    validateMemberInVoice,
    validateClientInVoice,
    validateSameVoiceChannel,
} from "../../utils/validators";
import {
    assertPlayerIsPlaying,
    getGuildMusicPlayer,
    getMusicCommandContext,
} from "./context";

export class SeekCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.DEFAULT;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("seek")
            .setDescription("Seeks to a specific position in the current song.")
            .setContexts(InteractionContextType.Guild)
            .addIntegerOption((builder) =>
                builder
                    .setName("position")
                    .setDescription("Position to seek to in seconds.")
                    .setRequired(true),
            );
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const { guild, member } = getMusicCommandContext(interaction);
            validateMemberInVoice(member);
            validateClientInVoice(guild);
            validateSameVoiceChannel(member);
        } catch (err) {
            await this.handleError(interaction, err);
            throw err;
        }

        const { guild } = getMusicCommandContext(interaction);
        const player = getGuildMusicPlayer(guild.id);
        const position = interaction.options.getInteger("position", true);

        try {
            assertPlayerIsPlaying(player);
        } catch (err) {
            await this.handleError(interaction, err);
            return;
        }

        try {
            await player.seek(position);
        } catch (err) {
            if (err instanceof MusicPlayerError) {
                if (
                    err.code === MusicPlayerErrorCode.SEEK_POSITION_OUT_OF_RANGE
                ) {
                    await this.replyWithError(
                        interaction,
                        "The specified position is out of range. Please specify a valid position.",
                    );
                } else {
                    await this.replyWithError(
                        interaction,
                        "An error has occurred.",
                    );
                }
            }
            throw err;
        }

        const formattedPosition = millisecondsToHHMMSS(
            position * MUSIC_PLAYER.MS_PER_SECOND,
        );
        const embed = this.createEmbed(
            `:fast_forward:  -  Seeked to ${formattedPosition}`,
        );
        await interaction.reply({ embeds: [embed] });
    }
}
