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
import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";

export class SkipCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 1;
        this.data = new SlashCommandBuilder()
            .setName("skip")
            .setDescription("Skips the current song.")
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
            if (!(err instanceof ValidationError)) {
                throw err;
            }
            const content = getValidationErrorMessage(err);
            await interaction.reply({ content, ephemeral: true });
            return;
        }

        const guild = interaction.guild!;
        const player = musicPlayers.get(guild.id)!;

        if (!player.isPlaying()) {
            await interaction.reply({
                content: "There is no song playing.",
                ephemeral: true,
            });
            return;
        }

        await player.skip();

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(":fast_forward:  -  Song skipped");

        await interaction.reply({ embeds: [embed] });
    }
}
