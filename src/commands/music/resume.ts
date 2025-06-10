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
    createNowPlayingEmbed,
    inVoiceChannel,
} from "../../utils/functions";
import { musicPlayers } from "../../core/managers";
import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";

export class ResumeCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 1;
        this.data = new SlashCommandBuilder()
            .setName("resume")
            .setDescription("Resumes the current song.")
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

        const player = musicPlayers.get(interaction.guildId!)!;

        if (!player.isPlaying()) {
            await interaction.reply({
                content: "There is no song playing.",
                ephemeral: true,
            });
            return;
        }

        if (!(await player.unpause())) {
            await interaction.reply({
                content: "Song is not paused.",
                ephemeral: true,
            });
            return;
        }

        const currentSong = (await player.getCurrentSong())!;
        const embed = createNowPlayingEmbed(currentSong);

        await interaction.reply({ embeds: [embed] });
    }
}
