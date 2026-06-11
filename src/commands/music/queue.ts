import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    InteractionContextType,
    SharedSlashCommand,
    SlashCommandBuilder,
    Snowflake,
} from "discord.js";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS, TIMEOUTS } from "../../config";
import { QueueView } from "../../views";
import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";
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

export default class QueueCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.FAST;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("queue")
            .setDescription("Displays the current song queue.")
            .setContexts(InteractionContextType.Guild);
    }

    private validateUser(
        interaction: ButtonInteraction,
        originalUserId: Snowflake,
    ): void {
        if (interaction.user.id !== originalUserId) {
            throw new ValidationError({
                code: ValidationErrorCode.QUEUE_MENU_NOT_FOR_USER,
            });
        }
    }

    private async handleValidInteraction(
        interaction: ButtonInteraction,
        view: QueueView,
    ): Promise<void> {
        if (interaction.customId === "previous-page") {
            await view.setCurrentPage(view.getCurrentPage() - 1);
        } else if (interaction.customId === "next-page") {
            await view.setCurrentPage(view.getCurrentPage() + 1);
        }

        const actionRow = await view.getActionRow();
        const embed = await view.getEmbed();

        if (actionRow.components.length === 0) {
            await interaction.update({ components: [], embeds: [embed] });
        } else {
            await interaction.update({
                components: [actionRow],
                embeds: [embed],
            });
        }
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

        const view = new QueueView(player);
        const actionRow = await view.getActionRow();
        const embed = await view.getEmbed();

        if (actionRow.components.length === 0) {
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const message = await interaction.reply({
            components: [actionRow],
            embeds: [embed],
        });
        const collector = message.createMessageComponentCollector({
            time: TIMEOUTS.SEARCH_MENU_MS,
        });

        const originalUserId = interaction.user.id;

        collector.on(
            "collect",
            async (buttonInteraction: ButtonInteraction) => {
                try {
                    this.validateUser(buttonInteraction, originalUserId);

                    const { guild, member } =
                        getMusicCommandContext(buttonInteraction);
                    validateMemberInVoice(member);
                    validateClientInVoice(guild);
                    validateSameVoiceChannel(member);

                    await this.handleValidInteraction(buttonInteraction, view);
                } catch (err) {
                    console.error(err);
                    if (err instanceof Error) {
                        await buttonInteraction
                            .reply({ content: err.message, ephemeral: true })
                            .catch(this.logError);
                    }
                }
            },
        );

        collector.on("end", async () => {
            const finalActionRow = await view.getActionRow();
            finalActionRow.components.forEach((button) =>
                button.setDisabled(true),
            );
            const embed = await view.getEmbed();

            const options =
                finalActionRow.components.length === 0
                    ? { components: [], embeds: [embed] }
                    : { components: [finalActionRow], embeds: [embed] };

            await message.edit(options).catch(this.logError);
        });
    }
}
