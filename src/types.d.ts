import {
    ChatInputCommandInteraction,
    Events,
    SharedSlashCommand,
} from "discord.js";

export type AsyncRunner = (...args: any[]) => Promise<void>;

export type Runner = (...args: any[]) => void;

export interface Command {
    cooldown: number;
    data: SharedSlashCommand;
    run: Runner | AsyncRunner;
}

export interface EventHandler {
    eventName: Events;
    once?: boolean;
    handle: Runner | AsyncRunner;
}

export interface SongData {
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: number;
    volume?: number;
}
