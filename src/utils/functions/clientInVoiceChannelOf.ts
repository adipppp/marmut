import { Guild } from "discord.js";

export function clientInVoiceChannelOf(guild: Guild) {
    const clientId = guild.client.user.id;
    const voiceState = guild.voiceStates.cache.get(clientId);
    return voiceState !== undefined && voiceState.channelId;
}
