import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
    VoiceBasedChannel,
} from "discord.js";
import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    inVoiceChannel,
    joinVoiceChannel,
} from "../../utils/functions";

const JOIN_EMOJI = process.env.JOIN_EMOJI;

export class JoinCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 2;
        this.data = new SlashCommandBuilder()
            .setName("join")
            .setDescription("Connects to a voice channel.")
            .setDMPermission(false)
            .addChannelOption((builder) =>
                builder
                    .setName("channel")
                    .setDescription(
                        "The voice channel to connect to. Defaults to your current voice channel.",
                    )
                    .setRequired(false),
            );
    }

    private validateArgs(interaction: ChatInputCommandInteraction) {
        const channel = interaction.options.getChannel("channel");
        const guild = interaction.guild!;

        if (channel) {
            const channelId = channel.id;
            const channelFromCache = guild.channels.cache.get(channelId)!;

            if (!channelFromCache.isVoiceBased()) {
                throw new ValidationError({
                    code: ValidationErrorCode.INVALID_VOICE_CHANNEL,
                });
            }
        } else {
            const member = interaction.member as GuildMember;

            if (!inVoiceChannel(member)) {
                throw new ValidationError({
                    code: ValidationErrorCode.MISSING_VOICE_CHANNEL,
                });
            }
        }
    }

    private validatePreconditions(interaction: ChatInputCommandInteraction) {
        this.validateArgs(interaction);

        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        const clientInSameVoiceChannelAsMember =
            clientInSameVoiceChannelAs(member);

        if (!clientInSameVoiceChannelAsMember && clientIsPlayingIn(guild)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE,
            });
        }

        const voiceChannel = (interaction.options.getChannel("channel") ??
            member.voice.channel) as VoiceBasedChannel;

        if (!clientInSameVoiceChannelAsMember && !voiceChannel.joinable) {
            throw new ValidationError({
                code: ValidationErrorCode.NON_JOINABLE_VOICE_CHANNEL,
            });
        }
    }

    async run(interaction: ChatInputCommandInteraction) {
        try {
            this.validatePreconditions(interaction);
        } catch (err) {
            if (err instanceof Error) {
                interaction
                    .reply({ content: err.message, ephemeral: true })
                    .catch(() => {});
            }
            throw err;
        }

        const guild = interaction.guild!;

        const clientId = interaction.client.user.id;
        const clientVoiceState = guild.voiceStates.cache.get(clientId);
        const clientVoiceChannelId = clientVoiceState?.channelId;

        const member = interaction.member as GuildMember;
        const memberVoiceChannel = member.voice.channel!;

        const channel = interaction.options.getChannel("channel");
        const channelId = (channel ?? memberVoiceChannel).id;

        if (clientVoiceChannelId === channelId) {
            await interaction.reply({
                content: "Already connected to the voice channel.",
                ephemeral: true,
            });
            return;
        }

        const voiceChannel = (interaction.options.getChannel("channel") ??
            member.voice.channel) as VoiceBasedChannel;
        await joinVoiceChannel(voiceChannel);

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(`${JOIN_EMOJI}  -  Connected to the voice channel`);

        await interaction.reply({ embeds: [embed] });
    }
}
