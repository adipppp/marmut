import {
    AudioPlayerStatus,
    VoiceConnectionStatus,
    getVoiceConnection,
} from "@discordjs/voice";
import { Guild } from "discord.js";

export function clientIsPlayingMusic(guild: Guild) {
    const connection = getVoiceConnection(guild.id);
    if (!connection) {
        return false;
    }

    const voiceConnectionState = connection.state;
    if (voiceConnectionState.status === VoiceConnectionStatus.Destroyed) {
        return false;
    }

    const subscription = voiceConnectionState.subscription;
    if (!subscription) {
        return false;
    }

    const audioPlayerState = subscription.player.state;
    if (audioPlayerState.status === AudioPlayerStatus.Idle) {
        return false;
    }

    return true;
}
