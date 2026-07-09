import { Colors } from "discord.js";

export const MUSIC_PLAYER = {
    DEFAULT_VOLUME: 10,
    MIN_VOLUME: 0,
    MAX_VOLUME: 100,
    MS_PER_SECOND: 1000,
} as const;

export const TIMEOUTS = {
    AUTO_DISCONNECT_MS: 5 * 60 * 1000, // 5 minutes
    SEARCH_MENU_MS: 60_000, // 1 minute
} as const;

export const DURATION = {
    MAX_SONG_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export const COOLDOWNS = {
    DEFAULT: 3,
    FAST: 1,
    SLOW: 2,
} as const;

export const EMBED_COLOR = Colors.Red;
