import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { RepeatMode } from "../../enums";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientInVoiceChannelOf,
    inVoiceChannel,
} from "../../utils/functions";
import { musicPlayers } from "../../core/managers";
import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";

export class RepeatCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 1;
        this.data = new SlashCommandBuilder()
            .setName("repeat")
            .setDescription("Sets the repeat mode of the music player.")
            .setDMPermission(false)
            .addStringOption((builder) =>
                builder
                    .setName("mode")
                    .setDescription("The repeat mode to set.")
                    .setRequired(false)
                    .addChoices(
                        { name: "off", value: "off" },
                        { name: "song", value: "song" },
                        { name: "queue", value: "queue" },
                    ),
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

    private createModeInfoEmbed(mode: RepeatMode) {
        let desc;
        if (mode === RepeatMode.Off) {
            desc = ":repeat:  -  Current repeat mode: Off";
        } else if (mode === RepeatMode.Song) {
            desc = ":repeat_one:  -  Current repeat mode: Song";
        } else if (mode === RepeatMode.Queue) {
            desc = ":repeat:  -  Current repeat mode: Queue";
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(desc!);

        return embed;
    }

    private createModeSwitchEmbed(mode: RepeatMode) {
        let desc;
        if (mode === RepeatMode.Off) {
            desc = ":x:  -  Repeat disabled";
        } else if (mode === RepeatMode.Song) {
            desc = ":repeat_one:  -  Song repeat enabled";
        } else if (mode === RepeatMode.Queue) {
            desc = ":repeat:  -  Queue repeat enabled";
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(desc!);

        return embed;
    }

    private createSameModeMessage(mode: RepeatMode) {
        let message;
        if (mode === RepeatMode.Off) {
            message = "Repeat feature is already disabled.";
        } else if (mode === RepeatMode.Song) {
            message = 'Repeat mode is already set to "Song".';
        } else if (mode === RepeatMode.Queue) {
            message = 'Repeat mode is already set to "Queue".';
        }

        return message;
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

        const inputMode = interaction.options.getString("mode");
        const guildId = interaction.guildId!;
        const player = musicPlayers.get(guildId)!;
        const currentMode = player.getRepeatMode();

        if (inputMode === null) {
            const embed = this.createModeInfoEmbed(currentMode);
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const newMode = inputMode as RepeatMode;

        if (currentMode === newMode) {
            const content = this.createSameModeMessage(newMode);
            await interaction.reply({ content, ephemeral: true });
            return;
        }

        player.setRepeatMode(newMode);

        const embed = this.createModeSwitchEmbed(newMode);
        await interaction.reply({ embeds: [embed] });
    }
}
