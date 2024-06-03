import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";

export class PingCommand implements Command {
    data: SlashCommandBuilder;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("ping")
            .setDescription("Replies with Pong!");
    }

    async handle(interaction: ChatInputCommandInteraction) {
        try {
            await interaction.reply("Pong!");
        } catch (err) {
            throw err;
        }
    }
}
