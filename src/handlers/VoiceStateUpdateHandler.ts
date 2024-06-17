import { VoiceState } from "discord.js";
import { Handler } from "../types";
import { musicPlayers } from "../core/music";
import { getVoiceConnection } from "@discordjs/voice";

export class VoiceStateUpdateHandler implements Handler {
    async handle(oldState: VoiceState, newState: VoiceState) {
        const clientId = oldState.client.user.id;
        const guildId = oldState.guild.id;

        if (oldState.id !== clientId || newState.channelId) {
            return;
        }

        const player = musicPlayers.get(guildId);
        await player?.stop();

        musicPlayers.delete(guildId);

        const connection = getVoiceConnection(guildId);
        connection?.destroy();
    }
}
