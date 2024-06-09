import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types";
import {
    clientIsPlayingAudio,
    memberInSameVoiceChannel,
    memberInVoiceChannel,
} from "../../utils/functions";
import { joinVoiceChannel } from "@discordjs/voice";

export class PlayCommand implements Command {
    readonly data: SlashCommandBuilder;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Play a song");
    }

    private async joinVoiceChannel(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild!;
        const member = interaction.member!;

        if (!(member instanceof GuildMember)) {
            throw new Error("member is not a GuildMember");
        }

        if (!memberInSameVoiceChannel(member) && !clientIsPlayingAudio(guild)) {
            await interaction.reply({
                content:
                    "Bot is already playing music in another voice channel.",
                ephemeral: true,
            });
            return false;
        }

        const voiceState = member.voice;
        const channelId = voiceState.channelId!;
        const guildId = guild.id;

        joinVoiceChannel({
            channelId,
            guildId,
            adapterCreator: guild.voiceAdapterCreator,
        });

        return true;
    }

    async run(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild!;
        const member = guild.members.cache.get(interaction.user.id)!;

        if (!memberInVoiceChannel(member)) {
            await interaction.reply({
                content:
                    "You need to be in a voice channel to use this command.",
                ephemeral: true,
            });
            return;
        }

        if (!(await this.joinVoiceChannel(interaction))) {
            return;
        }

        // TODO: play song

        await interaction.reply("Playing a song...");
    }
}
