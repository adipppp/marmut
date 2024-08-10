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

export class PauseCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 1;
        this.data = new SlashCommandBuilder()
            .setName("pause")
            .setDescription("Pauses the music player. Use /resume to unpause.")
            .setDMPermission(false);
    }

    private validatePreconditions(interaction: ChatInputCommandInteraction) {
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

        const player = musicPlayers.get(interaction.guildId!)!;

        if (!player.isPlaying()) {
            await interaction.reply({
                content: "There is no song playing.",
                ephemeral: true,
            });
            return;
        }

        if (!player.pause()) {
            await interaction.reply({
                content: "Music player is already paused.",
                ephemeral: true,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(":pause_button:  -  Music player paused");

        await interaction.reply({ embeds: [embed] });
    }
}
