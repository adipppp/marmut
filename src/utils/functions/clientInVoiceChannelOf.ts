import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Guild } from "discord.js";

export function clientInVoiceChannelOf(guild: Guild) {
    const connection = getVoiceConnection(guild.id);
    const status = connection?.state.status;
    return status !== undefined && status !== VoiceConnectionStatus.Destroyed;
}
