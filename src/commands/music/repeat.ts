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
                        { name: "queue", value: "queue" }
                    )
            );
    }

    private async validatePreconditions(
        interaction: ChatInputCommandInteraction
    ) {
        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!inVoiceChannel(member)) {
            await interaction.reply({
                content:
                    "You need to be in a voice channel to use this command.",
                ephemeral: true,
            });
            return false;
        }

        if (!clientInVoiceChannelOf(guild)) {
            await interaction.reply({
                content: "Bot is not connected to any voice channel.",
                ephemeral: true,
            });
            return false;
        }

        if (!clientInSameVoiceChannelAs(member)) {
            await interaction.reply({
                content: "You need to be in the same voice channel as the bot.",
                ephemeral: true,
            });
            return false;
        }

        return true;
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
        if (!(await this.validatePreconditions(interaction))) {
            return;
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
