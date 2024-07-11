import {
    ChatInputCommandInteraction,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
    VoiceBasedChannel,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientIsPlayingIn,
    inVoiceChannel,
} from "../../utils/functions";
import { joinVoiceChannel } from "@discordjs/voice";

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

        if (channel !== null) {
            const channelId = channel.id;
            const channelFromCache = guild.channels.cache.get(channelId)!;

            if (!channelFromCache.isVoiceBased()) {
                await interaction.reply({
                    content: "The channel specified is not a voice channel.",
                    ephemeral: true,
                });
                return false;
            }
        } else {
            const member = interaction.member as GuildMember;

            if (!inVoiceChannel(member)) {
                await interaction.reply({
                    content:
                        "You need to specify or be in a voice channel to use this command.",
                    ephemeral: true,
                });
                return false;
            }
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

    async run(interaction: ChatInputCommandInteraction) {
        if (!(await this.validatePreconditions(interaction))) {
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
