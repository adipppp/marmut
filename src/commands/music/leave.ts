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
    inVoiceChannel,
} from "../../utils/functions";
import { getVoiceConnection } from "@discordjs/voice";
import { musicPlayers } from "../../core/managers";

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
                content: "Bot is already disconnected from voice channels.",
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
        await player.stop();

        const connection = getVoiceConnection(guildId)!;
        connection.destroy();

        await interaction.reply("Disconnected from the voice channel.");
    }
}
