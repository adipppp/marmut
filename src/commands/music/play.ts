import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    Events,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
    VoiceBasedChannel,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    getValidationErrorMessage,
    inVoiceChannel,
} from "../../utils/functions";
import { joinVoiceChannel } from "@discordjs/voice";
import YouTube, { Video } from "youtube-sr";
import { Song } from "../../core/music";
import { musicPlayers } from "../../core/managers";
import { ValidationError, ValidationErrorCode } from "../../errors";
import EventEmitter, { once } from "events";

const MARMUT_ICON_40PX = process.env.MARMUT_ICON_40PX;

export class PlayCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 3;
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

    private validatePreconditions(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!inVoiceChannel(member)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_VOICE,
            });
        }

        if (!clientInSameVoiceChannelAs(member) && clientIsPlayingIn(guild)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE,
            });
        }

        const voiceChannel = member.voice.channel!;

        if (!voiceChannel.joinable) {
            throw new ValidationError({
                code: ValidationErrorCode.NON_JOINABLE_VOICE_CHANNEL,
            });
        }
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
            .setFooter({ text: "Marmut", iconURL: MARMUT_ICON_40PX })
            .setDescription(description);
    }

    async run(interaction: ChatInputCommandInteraction) {
        try {
            this.validatePreconditions(interaction);
        } catch (err) {
            if (!(err instanceof ValidationError)) {
                throw err;
            }
            const content = getValidationErrorMessage(err);
            await interaction.reply({ content, ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const query = interaction.options.getString("song", true);
        const result = await YouTube.searchOne(query);

        if (!result) {
            await interaction.editReply("Could not find the song.");
            return;
        }

        const member = interaction.member as GuildMember;
        const guild = interaction.guild!;

        if (!clientInSameVoiceChannelAs(member) && !clientIsPlayingIn(guild)) {
            this.joinVoiceChannel(member.voice.channel!);
            const client = interaction.client as unknown;
            await once(client as EventEmitter, Events.VoiceStateUpdate);
        }

        const guildId = guild.id;
        const player = musicPlayers.get(guildId)!;
        const song = this.createSong(result);
        const currentIndex = player.getCurrentIndex();

        try {
            await player.play(song, interaction.channel!);
        } catch (err) {
            await interaction.editReply(
                "Bot is not connected to any voice channel."
            );
            throw err;
        }

        const embed = this.createEmbed(song, currentIndex);
        await interaction.editReply({ embeds: [embed] });
    }
}
