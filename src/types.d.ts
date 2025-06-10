import {
    ChatInputCommandInteraction,
    Events,
    SharedSlashCommand,
} from "discord.js";

export interface Command {
    cooldown: number;
    data: SharedSlashCommand;
    run(interaction: ChatInputCommandInteraction): void | Promise<void>;
}

export interface EventHandler {
    eventName: Events;
    once?: boolean;
    handle(...args: any[]): void | Promise<void>;
}

export interface ClientEventListener {
    listen(): void;
}

export interface SongData {
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: bigint;
    volume?: number;
}
