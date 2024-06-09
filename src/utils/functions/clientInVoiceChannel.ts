import { Guild } from "discord.js";

const CLIENT_ID = process.env.CLIENT_ID;

export function clientInVoiceChannel(guild: Guild) {
    if (!CLIENT_ID) {
        throw new Error("CLIENT_ID environment variable is undefined");
    }

    const voiceState = guild.voiceStates.cache.get(CLIENT_ID);
    return voiceState !== undefined && voiceState.channelId !== null;
}
