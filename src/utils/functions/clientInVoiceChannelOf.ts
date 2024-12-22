import { Guild } from "discord.js";

export function clientInVoiceChannelOf(guild: Guild) {
    return guild.voiceStates.cache.has(guild.client.user.id);
}
