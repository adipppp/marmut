import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";

export class PingCommand implements Command {
    readonly data: SlashCommandBuilder;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("ping")
            .setDescription("Replies with Pong!");
    }

    async run(interaction: ChatInputCommandInteraction) {
        try {
            await interaction.reply("Pong!");
        } catch (err) {
            throw err;
        }
    }
}
