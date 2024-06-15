import { VoiceState } from "discord.js";
import { Handler } from "../types";
import { musicPlayers } from "../core/music";
import { getVoiceConnection } from "@discordjs/voice";

export class VoiceStateUpdateHandler implements Handler {
    async handle(oldState: VoiceState, newState: VoiceState) {
        const clientId = oldState.client.user.id;

        if (oldState.id !== clientId || newState.channelId) {
            return;
        }

        const guildId = oldState.guild.id;
        const player = musicPlayers.get(guildId);

        if (!player) {
            return;
        }

        musicPlayers.delete(guildId);

        const connection = getVoiceConnection(guildId);
        if (!connection || !player.isPlaying()) {
            return;
        }

        const stream = player.playStream!;
        await player.stop();
        stream.destroy();

        connection.destroy();
    }
}
