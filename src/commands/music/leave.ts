import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS, env } from "../../config";
import {
    validateMemberInVoice,
    validateClientInVoice,
    validateSameVoiceChannel,
} from "../../utils/validators";
import { leaveVoiceChannel } from "../../utils/functions";
import { getMusicCommandContext } from "./context";

export class LeaveCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.SLOW;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("leave")
            .setDescription("Disconnects from the voice channel.")
            .setContexts(InteractionContextType.Guild);
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const { guild, member } = getMusicCommandContext(interaction);
            validateMemberInVoice(member);
            validateClientInVoice(guild);
            validateSameVoiceChannel(member);

            await leaveVoiceChannel(guild.id);

            const embed = this.createEmbed(
                `${env.ui.leaveEmoji}  -  Disconnected from the voice channel`,
            );
            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            await this.handleError(interaction, err);
            throw err;
        }
    }
}
