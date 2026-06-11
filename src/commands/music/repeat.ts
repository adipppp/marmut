import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS } from "../../config";
import { RepeatMode } from "../../enums";
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

export default class RepeatCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.FAST;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("repeat")
            .setDescription("Sets the repeat mode of the music player.")
            .setContexts(InteractionContextType.Guild)
            .addStringOption((builder) =>
                builder
                    .setName("mode")
                    .setDescription("The repeat mode to set.")
                    .setRequired(false)
                    .addChoices(
                        { name: "off", value: "off" },
                        { name: "song", value: "song" },
                        { name: "queue", value: "queue" },
                    ),
            );
    }

    private getModeDescription(mode: RepeatMode, isInfo: boolean): string {
        const descriptions: Record<
            RepeatMode,
            { info: string; switch: string }
        > = {
            [RepeatMode.Off]: {
                info: ":repeat:  -  Current repeat mode: Off",
                switch: ":x:  -  Repeat disabled",
            },
            [RepeatMode.Song]: {
                info: ":repeat_one:  -  Current repeat mode: Song",
                switch: ":repeat_one:  -  Song repeat enabled",
            },
            [RepeatMode.Queue]: {
                info: ":repeat:  -  Current repeat mode: Queue",
                switch: ":repeat:  -  Queue repeat enabled",
            },
        };
        return isInfo ? descriptions[mode].info : descriptions[mode].switch;
    }

    private getSameModeMessage(mode: RepeatMode): string {
        const messages: Record<RepeatMode, string> = {
            [RepeatMode.Off]: "Repeat feature is already disabled.",
            [RepeatMode.Song]: 'Repeat mode is already set to "Song".',
            [RepeatMode.Queue]: 'Repeat mode is already set to "Queue".',
        };
        return messages[mode];
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

        const inputMode = interaction.options.getString("mode");
        const { guild } = getMusicCommandContext(interaction);
        const player = getGuildMusicPlayer(guild.id);
        try {
            assertPlayerIsPlaying(player);
        } catch (err) {
            await this.handleError(interaction, err);
            return;
        }
        const currentMode = player.getRepeatMode();

        if (inputMode === null) {
            const embed = this.createEmbed(
                this.getModeDescription(currentMode, true),
            );
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const newMode = inputMode as RepeatMode;

        if (currentMode === newMode) {
            await this.replyWithError(
                interaction,
                this.getSameModeMessage(newMode),
            );
            return;
        }

        player.setRepeatMode(newMode);

        const embed = this.createEmbed(this.getModeDescription(newMode, false));
        await interaction.reply({ embeds: [embed] });
    }
}
