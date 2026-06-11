import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
    VoiceBasedChannel,
} from "discord.js";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS, env } from "../../config";
import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    inVoiceChannel,
    joinVoiceChannel,
} from "../../utils/functions";
import { getMusicCommandContext } from "./context";

export default class JoinCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.SLOW;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("join")
            .setDescription("Connects to a voice channel.")
            .setContexts(InteractionContextType.Guild)
            .addChannelOption((builder) =>
                builder
                    .setName("channel")
                    .setDescription(
                        "The voice channel to connect to. Defaults to your current voice channel.",
                    )
                    .setRequired(false),
            );
    }

    private validateArgs(interaction: ChatInputCommandInteraction): void {
        const channel = interaction.options.getChannel("channel");
        const { guild, member } = getMusicCommandContext(interaction);

        if (channel) {
            const channelId = channel.id;
            const channelFromCache = guild.channels.cache.get(channelId)!;

            if (!channelFromCache.isVoiceBased()) {
                throw new ValidationError({
                    code: ValidationErrorCode.INVALID_VOICE_CHANNEL,
                });
            }
        } else {
            if (!inVoiceChannel(member)) {
                throw new ValidationError({
                    code: ValidationErrorCode.MISSING_VOICE_CHANNEL,
                });
            }
        }
    }

    private validatePreconditions(
        interaction: ChatInputCommandInteraction,
    ): void {
        this.validateArgs(interaction);

        const { guild, member } = getMusicCommandContext(interaction);

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

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            this.validatePreconditions(interaction);
        } catch (err) {
            await this.handleError(interaction, err);
            throw err;
        }

        const { guild, member } = getMusicCommandContext(interaction);

        const clientId = interaction.client.user.id;
        const clientVoiceState = guild.voiceStates.cache.get(clientId);
        const clientVoiceChannelId = clientVoiceState?.channelId;

        const memberVoiceChannel = member.voice.channel!;

        const channel = interaction.options.getChannel("channel");
        const channelId = (channel ?? memberVoiceChannel).id;

        if (clientVoiceChannelId === channelId) {
            await this.replyWithError(
                interaction,
                "Already connected to the voice channel.",
            );
            return;
        }

        const voiceChannel = (interaction.options.getChannel("channel") ??
            member.voice.channel) as VoiceBasedChannel;
        await joinVoiceChannel(voiceChannel);

        const embed = this.createEmbed(
            `${env.ui.joinEmoji}  -  Connected to the voice channel`,
        );
        await interaction.reply({ embeds: [embed] });
    }
}
