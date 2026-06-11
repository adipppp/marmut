import "dotenv/config";

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined) {
        throw new Error(`${name} environment variable is undefined`);
    }
    return value;
}

function getOptionalEnv(name: string): string | undefined {
    return process.env[name];
}

function getBooleanEnv(name: string): boolean {
    return process.env[name] === "true";
}

function getOptionalBooleanEnv(name: string): boolean | undefined {
    const value = process.env[name];
    if (value === undefined) return undefined;
    return value === "true";
}

export const env = {
    discord: {
        token: getRequiredEnv("DISCORD_TOKEN"),
        clientId: getRequiredEnv("CLIENT_ID"),
        guildId: getOptionalEnv("GUILD_ID"),
        autoRegisterCommands: getOptionalBooleanEnv("AUTO_REGISTER_COMMANDS") ?? true,
    },
    lavalink: {
        nodeName: getRequiredEnv("LAVALINK_NODE_NAME"),
        nodeUrl: getRequiredEnv("LAVALINK_NODE_URL"),
        nodeAuth: getRequiredEnv("LAVALINK_NODE_AUTH"),
        isSecure: getBooleanEnv("LAVALINK_NODE_IS_SECURE"),
    },
    ui: {
        joinEmoji: getOptionalEnv("JOIN_EMOJI") ?? "🎵",
        leaveEmoji: getOptionalEnv("LEAVE_EMOJI") ?? "👋",
        errorEmoji: getOptionalEnv("ERROR_EMOJI") ?? "❌",
        marmutIcon40px: getOptionalEnv("MARMUT_ICON_40PX"),
    },
} as const;
