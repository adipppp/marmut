import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { lavalinkClient } from "../../core/client";
import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientInVoiceChannelOf,
    inVoiceChannel,
} from "../../utils/functions";

const LEAVE_EMOJI = process.env.LEAVE_EMOJI;

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
            if (err instanceof Error) {
                interaction
                    .reply({ content: err.message, ephemeral: true })
                    .catch(() => {});
            }
            throw err;
        }

        const guildId = interaction.guildId!;

        await lavalinkClient.leaveVoiceChannel(guildId);

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(
                `${LEAVE_EMOJI}  -  Disconnected from the voice channel`,
            );

        await interaction.reply({ embeds: [embed] });
    }
}
