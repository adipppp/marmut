import {
    ChatInputCommandInteraction,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    getValidationErrorMessage,
    inVoiceChannel,
} from "../../utils/functions";
import { joinVoiceChannel } from "@discordjs/voice";
import { ValidationError, ValidationErrorCode } from "../../errors";

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
                        "The voice channel to connect to. Defaults to your current voice channel."
                    )
                    .setRequired(false)
            );
    }

    private async validateArgs(interaction: ChatInputCommandInteraction) {
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

        return true;
    }

    private validatePreconditions(interaction: ChatInputCommandInteraction) {
        this.validateArgs(interaction);

        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

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

    async run(interaction: ChatInputCommandInteraction) {
        try {
            this.validatePreconditions(interaction);
        } catch (err) {
            console.error(err);
            if (err instanceof ValidationError) {
                const content = getValidationErrorMessage(err);
                await interaction.reply({ content, ephemeral: true });
            }
            return;
        }

        const guild = interaction.guild!;
        const guildId = guild.id;

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

        const adapterCreator = guild.voiceAdapterCreator;

        joinVoiceChannel({ guildId, channelId, adapterCreator });

        await interaction.reply("Connected to the voice channel.");
    }
}
