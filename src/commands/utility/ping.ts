import {
    ChatInputCommandInteraction,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { BaseCommand } from "../BaseCommand";
import { COOLDOWNS } from "../../config";

export class PingCommand extends BaseCommand {
    readonly cooldown = COOLDOWNS.SLOW;
    readonly data: SharedSlashCommand;

    constructor() {
        super();
        this.data = new SlashCommandBuilder()
            .setName("ping")
            .setDescription("Replies with Pong!");
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply("Pong!");
    }
}
