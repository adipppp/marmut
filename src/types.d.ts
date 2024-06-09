import {
    ChatInputCommandInteraction,
    SlashCommandOptionsOnlyBuilder,
} from "discord.js";

export type AsyncRunner = (
    ...args: ChatInputCommandInteraction[]
) => Promise<void>;

export type Runner = (...args: ChatInputCommandInteraction[]) => void;

export interface Command {
    data: SlashCommandOptionsOnlyBuilder;
    run: Runner | AsyncRunner;
}

export interface Handler {
    handle: (...args: any[]) => Promise<void> | void;
}

export interface SongData {
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: number;
    volume?: number;
}
