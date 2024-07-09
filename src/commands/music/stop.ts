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
    getMusicPlayer,
    inVoiceChannel,
} from "../../utils/functions";

export class StopCommand implements Command {
    readonly data: SharedSlashCommand;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("stop")
            .setDescription("Stops the music player.")
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

        const player = getMusicPlayer(interaction.guildId!);
        await player.stop();

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(":stop_button:  -  Music player stopped");

        await interaction.reply({ embeds: [embed] });
    }
}
