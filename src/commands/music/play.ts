import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    VoiceBasedChannel,
} from "discord.js";
import { Command } from "../../types";
import {
    clientIsPlayingAudio,
    memberInSameVoiceChannel,
    memberInVoiceChannel,
} from "../../utils/functions";
import { joinVoiceChannel } from "@discordjs/voice";
import YouTube from "youtube-sr";
import { Song, musicPlayers } from "../../core/music";

export class PlayCommand implements Command {
    readonly data: SlashCommandOptionsOnlyBuilder;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Play a song")
            .addStringOption((builder) =>
                builder
                    .setName("query")
                    .setDescription("The song to play. Can also be a URL.")
                    .setRequired(true)
            );
    }

    private async validatePreconditions(
        interaction: ChatInputCommandInteraction
    ) {
        const guild = interaction.guild!;
        const member = guild.members.cache.get(interaction.user.id)!;

        if (!memberInVoiceChannel(member)) {
            await interaction.reply({
                content:
                    "You need to be in a voice channel to use this command.",
                ephemeral: true,
            });
            return false;
        }

        if (!memberInSameVoiceChannel(member) && !clientIsPlayingAudio(guild)) {
            await interaction.reply({
                content:
                    "Bot is already playing a song in another voice channel.",
                ephemeral: true,
            });
            return false;
        }

        const channelId = member.voice.channelId!;
        const voiceChannel = guild.channels.cache.get(
            channelId
        ) as VoiceBasedChannel;

        if (!voiceChannel.joinable) {
            await interaction.reply({
                content: "Unable to connect to the voice channel.",
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

        await interaction.deferReply();

        const member = interaction.member as GuildMember;
        const guild = interaction.guild!;
        const channelId = member.voice.channelId!;
        const guildId = guild.id;
        const adapterCreator = guild.voiceAdapterCreator;

        joinVoiceChannel({ guildId, channelId, adapterCreator });

        const query = interaction.options.getString("query")!;
        const result = await YouTube.searchOne(query);

        if (!result) {
            await interaction.editReply("Cannot find the song.");
            return;
        }

        const song = new Song({
            title: result.title!,
            thumbnailUrl: result.thumbnail!.url!,
            videoUrl: result.url,
            duration: result.duration!,
        });

        const player = musicPlayers.get(guildId);
        await player.play(song);

        await interaction.editReply("Playing a song...");
    }
}
