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
    getMusicPlayer,
    inVoiceChannel,
} from "../../utils/functions";

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

    private createNoSwitchEmbed(mode: RepeatMode) {
        let desc = null;
        switch (mode) {
            case RepeatMode.Off:
                desc = ":repeat:  -  Current repeat mode: Off";
                break;
            case RepeatMode.Song:
                desc = ":repeat_one:  -  Current repeat mode: Song";
                break;
            case RepeatMode.Queue:
                desc = ":repeat:  -  Current repeat mode: Queue";
                break;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(desc);

        return embed;
    }

    private createModeSwitchEmbed(mode: RepeatMode) {
        let desc = null;
        switch (mode) {
            case RepeatMode.Off:
                desc = ":x:  -  Repeat disabled";
                break;
            case RepeatMode.Song:
                desc = ":repeat_one:  -  Song repeat enabled";
                break;
            case RepeatMode.Queue:
                desc = ":repeat:  -  Queue repeat enabled";
                break;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(desc);

        return embed;
    }

    async run(interaction: ChatInputCommandInteraction) {
        if (!(await this.validatePreconditions(interaction))) {
            return;
        }

        const inputMode = interaction.options.getString("mode");
        const guildId = interaction.guildId!;
        const player = getMusicPlayer(guildId);

        if (inputMode === null) {
            const mode = player.getRepeatMode();
            const embed = this.createNoSwitchEmbed(mode);
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const mode = inputMode as RepeatMode;

        const currentMode = player.getRepeatMode();
        if (currentMode === mode) {
            if (mode === RepeatMode.Off)
                await interaction.reply({
                    content: "Repeat feature is already disabled.",
                    ephemeral: true,
                });
            else if (mode === RepeatMode.Song)
                await interaction.reply({
                    content: 'Repeat mode is already set to "Song".',
                    ephemeral: true,
                });
            else if (mode === RepeatMode.Queue)
                await interaction.reply({
                    content: 'Repeat mode is already set to "Queue"',
                    ephemeral: true,
                });
            return;
        }

        player.setRepeatMode(mode);

        const embed = this.createModeSwitchEmbed(mode);
        await interaction.reply({ embeds: [embed] });
    }
}
