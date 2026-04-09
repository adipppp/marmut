import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS } from "../../config";
import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";
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

export class RemoveCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.FAST;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("remove")
            .setDescription("Removes a song from the queue.")
            .setContexts(InteractionContextType.Guild)
            .addIntegerOption((builder) =>
                builder
                    .setName("position")
                    .setDescription(
                        "The position of the song in the queue. Starts from 1.",
                    )
                    .setRequired(true),
            );
    }

    private validatePosition(position: number): void {
        if (position < 1) {
            throw new ValidationError({
                code: ValidationErrorCode.NON_POSITIVE_SONG_POSITION,
            });
        }
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const position = interaction.options.getInteger("position", true);
            this.validatePosition(position);

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

        try {
            assertPlayerIsPlaying(player);
        } catch (err) {
            await this.handleError(interaction, err);
            return;
        }

        const queue = await player.getQueue();
        const position = interaction.options.getInteger("position", true) - 1;

        if (position >= queue.length) {
            await this.replyWithError(
                interaction,
                "Position is out of range. Please enter a valid song position.",
            );
            return;
        }

        await player.removeSong(position);

        const embed = this.createEmbed(":x:  -  Song removed from queue");
        await interaction.reply({ embeds: [embed] });
    }
}
