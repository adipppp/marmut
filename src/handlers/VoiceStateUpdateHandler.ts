import { VoiceState } from "discord.js";
import { Handler } from "../types";
import { musicPlayers } from "../core/music";
import { getVoiceConnection } from "@discordjs/voice";

export class VoiceStateUpdateHandler implements Handler {
    async handle(oldState: VoiceState, newState: VoiceState) {
        const clientId = oldState.client.user.id;

        if (oldState.id !== clientId) {
            return;
        }

        if (newState.channelId === null) {
            const guildId = oldState.guild.id;
            const player = musicPlayers.get(guildId);

            if (player && player.isPlaying()) {
                const stream = player.getPlayStream()!;
                player.stop();
                stream.destroy();
                musicPlayers.delete(guildId);
            }

            const connection = getVoiceConnection(guildId);
            connection?.destroy();
        }
    }
}
