import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientInVoiceChannelOf,
    getValidationErrorMessage,
    inVoiceChannel,
} from "../../utils/functions";
import { musicPlayers } from "../../core/managers";
import { ValidationError, ValidationErrorCode } from "../../errors";

export class RemoveCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 1;
        this.data = new SlashCommandBuilder()
            .setName("remove")
            .setDescription("Removes a song from the queue.")
            .setDMPermission(false)
            .addIntegerOption((builder) =>
                builder
                    .setName("position")
                    .setDescription(
                        "The position of the song in the queue. Starts from 1."
                    )
                    .setRequired(true)
            );
    }

    private validatePreconditions(interaction: ChatInputCommandInteraction) {
        const position = interaction.options.getInteger("position", true);

        if (position < 1) {
            throw new ValidationError({
                code: ValidationErrorCode.NON_POSITIVE_SONG_POSITION,
            });
        }

        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!inVoiceChannel(member)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_VOICE,
            });
        }

        if (!clientInVoiceChannelOf(guild)) {
            throw new ValidationError({
                code: ValidationErrorCode.CLIENT_NOT_IN_VOICE,
            });
        }

        if (!clientInSameVoiceChannelAs(member)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE,
            });
        }
    }

    async run(interaction: ChatInputCommandInteraction) {
        try {
            this.validatePreconditions(interaction);
        } catch (err) {
            console.error(err);
            if (err instanceof ValidationError) {
                const content = getValidationErrorMessage(err);
                await interaction.reply({ content, ephemeral: true });
            }
            return;
        }

        const guildId = interaction.guildId!;
        const player = musicPlayers.get(guildId)!;

        if (!player.isPlaying()) {
            await interaction.reply({
                content: "There is no song playing.",
                ephemeral: true,
            });
            return;
        }

        const queue = await player.getQueue();
        const position = interaction.options.getInteger("position", true) - 1;

        if (position >= queue.length) {
            await interaction.reply({
                content:
                    "Position is out of range. Please enter a valid song position.",
                ephemeral: true,
            });
            return;
        }

        await player.removeSong(position);

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(":x:  -  Song removed from queue");

        await interaction.reply({ embeds: [embed] });
    }
}
