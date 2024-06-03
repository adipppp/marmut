import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
    data: SlashCommandBuilder;
    handle: (...args: ChatInputCommandInteraction[]) => Promise<void> | void;
}

export interface Handler {
    handle: (...args: any[]) => Promise<void> | void;
}
