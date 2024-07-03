import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    VoiceBasedChannel,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    createMusicPlayer,
    inVoiceChannel,
} from "../../utils/functions";
import { joinVoiceChannel } from "@discordjs/voice";
import YouTube, { Video } from "youtube-sr";
import { Song, musicPlayers } from "../../core/music";

export class PlayCommand implements Command {
    readonly data: SlashCommandOptionsOnlyBuilder;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Plays a song.")
            .setDMPermission(false)
            .addStringOption((builder) =>
                builder
                    .setName("song")
                    .setDescription(
                        "The song to play. Can also be a YouTube video URL."
                    )
                    .setRequired(true)
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

        if (!clientInSameVoiceChannelAs(member) && clientIsPlayingIn(guild)) {
            await interaction.reply({
                content: "You need to be in the same voice channel as the bot.",
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

    private joinVoiceChannel(channel: VoiceBasedChannel) {
        const guild = channel.guild;
        const guildId = guild.id;
        const channelId = channel.id;
        const adapterCreator = guild.voiceAdapterCreator;

        joinVoiceChannel({ guildId, channelId, adapterCreator });
    }

    private createSong(video: Video) {
        return new Song({
            title: video.title!,
            thumbnailUrl: video.thumbnail!.url!,
            videoUrl: video.url,
            duration: video.duration!,
        });
    }

    private createEmbed(song: Song, currentIndex: number) {
        let description;
        if (currentIndex === -1) {
            description = `:arrow_forward:  -  Now Playing\n[${song.title}](${song.videoUrl})`;
        } else {
            description = `:white_check_mark:  -  Added to queue\n[${song.title}](${song.videoUrl})`;
        }

        return new EmbedBuilder()
            .setColor(Colors.Red)
            .setTimestamp()
            .setThumbnail(song.thumbnailUrl)
            .setFooter({ text: "Marmut" })
            .setDescription(description);
    }

    async run(interaction: ChatInputCommandInteraction) {
        if (!(await this.validatePreconditions(interaction))) {
            return;
        }

        await interaction.deferReply();

        const guild = interaction.guild!;
        const guildId = guild.id;
        const member = interaction.member as GuildMember;

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            this.joinVoiceChannel(member.voice.channel!);
        }

        const query = interaction.options.getString("query", true);
        const result = await YouTube.searchOne(query);

        if (!result) {
            await interaction.editReply("Could not find the song.");
            return;
        }

        const player = musicPlayers.get(guildId) ?? createMusicPlayer(guildId);
        const song = this.createSong(result);
        const currentIndex = player.getCurrentIndex();

        await player.play(song, interaction.channel);

        const embed = this.createEmbed(song, currentIndex);
        await interaction.editReply({ embeds: [embed] });
    }
}
