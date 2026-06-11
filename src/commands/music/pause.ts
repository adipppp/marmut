import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS } from "../../config";
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

export default class PauseCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.FAST;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("pause")
            .setDescription("Pauses the current song.")
            .setContexts(InteractionContextType.Guild);
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

        if (!(await player.pause())) {
            await this.replyWithError(interaction, "Song is already paused.");
            return;
        }

        const embed = this.createEmbed(":pause_button:  -  Song paused");
        await interaction.reply({ embeds: [embed] });
    }
}
