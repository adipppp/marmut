import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export type AsyncRunner = (
    ...args: ChatInputCommandInteraction[]
) => Promise<void>;

export type Runner = (...args: ChatInputCommandInteraction[]) => void;

export interface Command {
    data: SlashCommandBuilder;
    run: Runner | AsyncRunner;
}

export interface Handler {
    handle: (...args: any[]) => Promise<void> | void;
}
