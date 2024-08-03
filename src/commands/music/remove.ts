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

export class RemoveCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 1;
        this.data = new SlashCommandBuilder()
            .setName("remove")
            .setDescription("Removes a song from the queue.")
            .setDMPermission(false)
            .addIntegerOption((builder) =>
                builder
                    .setName("position")
                    .setDescription(
                        "The position of the song in the queue. Starts from 1."
                    )
                    .setRequired(true)
            );
    }

    private async validateArgs(interaction: ChatInputCommandInteraction) {
        const position = interaction.options.getInteger("position", true);

        if (position < 1) {
            await interaction.reply({
                content: "Position must be greater than 0.",
                ephemeral: true,
            });
            return false;
        }

        return true;
    }

    private async validatePreconditions(
        interaction: ChatInputCommandInteraction
    ) {
        if (!(await this.validateArgs(interaction))) {
            return false;
        }

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

        const guildId = interaction.guildId!;
        const player = musicPlayers.get(guildId)!;

        if (!player.isPlaying()) {
            await interaction.reply({
                content: "There is no song playing.",
                ephemeral: true,
            });
            return;
        }

        const queue = await player.getQueue();
        const position = interaction.options.getInteger("position", true) - 1;

        if (position >= queue.length) {
            await interaction.reply({
                content:
                    "Position is out of range. Please enter a valid song position.",
                ephemeral: true,
            });
            return;
        }

        await player.removeSong(position);

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(":x:  -  Song removed from queue");

        await interaction.reply({ embeds: [embed] });
    }
}
