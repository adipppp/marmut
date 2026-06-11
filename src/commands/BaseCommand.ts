import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    RepliableInteraction,
    SharedSlashCommand,
} from "discord.js";
import { Command } from "../types";
import { EMBED_COLOR } from "../config";

export abstract class BaseCommand implements Command {
    abstract readonly cooldown: number;
    abstract readonly data: SharedSlashCommand;

    abstract run(interaction: ChatInputCommandInteraction): void | Promise<void>;

    protected async replyWithError(
        interaction: RepliableInteraction,
        message: string,
    ): Promise<void> {
        const options = { content: message, ephemeral: true };
        if (interaction.deferred) {
            await interaction.editReply(options).catch(this.logError);
        } else {
            await interaction.reply(options).catch(this.logError);
        }
    }

    protected createEmbed(description: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setDescription(description);
    }

    protected logError(error: unknown): void {
        console.error("Failed to send interaction response:", error);
    }

    protected async handleError(
        interaction: RepliableInteraction,
        error: unknown,
    ): Promise<void> {
        const message =
            error instanceof Error ? error.message : "An unknown error occurred.";
        await this.replyWithError(interaction, message);
    }
}
