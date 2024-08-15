import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    GuildMember,
    SharedSlashCommand,
    SlashCommandBuilder,
    Snowflake,
} from "discord.js";
import { Command } from "../../types";
import {
    clientInSameVoiceChannelAs,
    clientInVoiceChannelOf,
    getValidationErrorMessage,
    inVoiceChannel,
} from "../../utils/functions";
import { QueueView } from "../../views";
import { musicPlayers } from "../../core/managers";
import { ValidationError, ValidationErrorCode } from "../../errors";

export class QueueCommand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 1;
        this.data = new SlashCommandBuilder()
            .setName("queue")
            .setDescription("Displays the current song queue.")
            .setDMPermission(false);
    }

    private validatePreconditions(
        interaction: ButtonInteraction | ChatInputCommandInteraction
    ) {
        const guild = interaction.guild!;
        const member = interaction.member as GuildMember;

        if (!inVoiceChannel(member)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_VOICE,
            });
        }

        if (!clientInVoiceChannelOf(guild)) {
            throw new ValidationError({
                code: ValidationErrorCode.CLIENT_NOT_IN_VOICE,
            });
        }

        if (!clientInSameVoiceChannelAs(member)) {
            throw new ValidationError({
                code: ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE,
            });
        }
    }

    private validateUser(
        interaction: ButtonInteraction,
        originalUserId: Snowflake
    ) {
        if (interaction.user.id !== originalUserId) {
            throw new ValidationError({
                code: ValidationErrorCode.QUEUE_MENU_NOT_FOR_USER,
            });
        }
    }

    private async handleValidInteraction(
        interaction: ButtonInteraction,
        view: QueueView
    ) {
        if (interaction.customId === "previous-page")
            await view.setCurrentPage(view.getCurrentPage() - 1);
        else if (interaction.customId === "next-page")
            await view.setCurrentPage(view.getCurrentPage() + 1);

        const actionRow = await view.getActionRow();
        const embed = await view.getEmbed();

        if (actionRow.components.length === 0)
            await interaction.update({ components: [], embeds: [embed] });
        else
            await interaction.update({
                components: [actionRow],
                embeds: [embed],
            });
    }

    async run(interaction: ChatInputCommandInteraction) {
        try {
            this.validatePreconditions(interaction);
        } catch (err) {
            if (err instanceof ValidationError) {
                const content = getValidationErrorMessage(err);
                await interaction.reply({ content, ephemeral: true });
            } else {
                console.error(err);
            }
            return;
        }

        const guildId = interaction.guildId!;
        const player = musicPlayers.get(guildId)!;

        if (!player.isPlaying()) {
            await interaction.reply({
                content: "There is no song playing.",
                ephemeral: true,
            });
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
            time: 60_000,
        });

        const originalUserId = interaction.user.id;

        collector.on("collect", async (interaction: ButtonInteraction) => {
            try {
                this.validateUser(interaction, originalUserId);
                this.validatePreconditions(interaction);
                await this.handleValidInteraction(interaction, view);
            } catch (err) {
                if (err instanceof ValidationError) {
                    const content = getValidationErrorMessage(err);
                    await interaction.reply({ content, ephemeral: true });
                } else {
                    console.error(err);
                }
            }
        });
    }
}
