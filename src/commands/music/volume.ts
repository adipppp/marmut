import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS, MUSIC_PLAYER } from "../../config";
import {
    validateMemberInVoice,
    validateClientInVoice,
    validateSameVoiceChannel,
} from "../../utils/validators";
import {
    assertPlayerIsPlaying,
    getGuildMusicPlayer,
    getMusicCommandContext,
} from "./context";

const { MIN_VOLUME, MAX_VOLUME } = MUSIC_PLAYER;

export default class VolumeCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.FAST;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("volume")
            .setDescription("Changes the volume of the music player.")
            .setContexts(InteractionContextType.Guild)
            .addIntegerOption((builder) =>
                builder
                    .setName("volume")
                    .setDescription("The volume to set.")
                    .setRequired(false),
            );
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const { guild, member } = getMusicCommandContext(interaction);
            validateMemberInVoice(member);
            validateClientInVoice(guild);
            validateSameVoiceChannel(member);
        } catch (err) {
            await this.handleError(interaction, err);
            throw err;
        }

        const { guild } = getMusicCommandContext(interaction);
        const player = getGuildMusicPlayer(guild.id);

        try {
            assertPlayerIsPlaying(player);
        } catch (err) {
            await this.handleError(interaction, err);
            return;
        }

        const currentVolume = player.getVolume();
        const newVolume = interaction.options.getInteger("volume");

        if (newVolume === null) {
            const embed = this.createEmbed(
                `:loud_sound:  -  Current volume: ${currentVolume}%`,
            );
            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (newVolume < MIN_VOLUME || newVolume > MAX_VOLUME) {
            await this.replyWithError(
                interaction,
                `Volume must be between ${MIN_VOLUME} and ${MAX_VOLUME}.`,
            );
            return;
        }

        await player.setVolume(newVolume);

        const embed = this.createEmbed(
            `:loud_sound:  -  Volume set to ${newVolume}%`,
        );
        await interaction.reply({ embeds: [embed] });
    }
}
