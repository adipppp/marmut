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

export class VolumeCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 1;
        this.data = new SlashCommandBuilder()
            .setName("volume")
            .setDescription("Changes the volume of the music player.")
            .setDMPermission(false)
            .addIntegerOption((builder) =>
                builder
                    .setName("volume")
                    .setDescription("The volume to set.")
                    .setRequired(false)
            );
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
        const guildId = guild.id;
        const player = musicPlayers.get(guildId)!;

        const currentVolume = player.getVolume();
        const newVolume = interaction.options.getInteger("volume");

        if (newVolume === null) {
            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(
                    `:loud_sound:  -  Current volume: ${currentVolume}%`
                );
            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (newVolume < 0 || newVolume > 100) {
            await interaction.reply({
                content: "Volume must be between 0 and 100.",
                ephemeral: true,
            });
            return;
        }

        player.setVolume(newVolume);

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(`:loud_sound:  -  Volume set to ${newVolume}%`);

        await interaction.reply({ embeds: [embed] });
    }
}
