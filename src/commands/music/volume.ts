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
    inVoiceChannel,
} from "../../utils/functions";
import { musicPlayers } from "../../core/managers";

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

    async run(interaction: ChatInputCommandInteraction) {
        if (!(await this.validatePreconditions(interaction))) {
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
