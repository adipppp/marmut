import { ChatInputCommandInteraction, SharedSlashCommand } from "discord.js";

export type AsyncRunner = (...args: any[]) => Promise<void>;

export type Runner = (...args: any[]) => void;

export interface Command {
    data: SharedSlashCommand;
    run: Runner | AsyncRunner;
}

export interface Handler {
    handle: Runner | AsyncRunner;
}

export interface SongData {
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: number;
    volume?: number;
}
