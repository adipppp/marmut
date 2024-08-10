import {
    ChatInputCommandInteraction,
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
import { getVoiceConnection } from "@discordjs/voice";
import { musicPlayers } from "../../core/managers";
import { ValidationError, ValidationErrorCode } from "../../errors";

export class LeaveCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 2;
        this.data = new SlashCommandBuilder()
            .setName("leave")
            .setDescription("Disconnects from the voice channel.")
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

        const guildId = interaction.guildId!;

        const player = musicPlayers.get(guildId)!;
        await player.stop();

        const connection = getVoiceConnection(guildId);
        connection?.destroy();

        await interaction.reply("Disconnected from the voice channel.");
    }
}
