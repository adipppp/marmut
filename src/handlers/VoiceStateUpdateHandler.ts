import { VoiceState } from "discord.js";
import { Handler } from "../types";
import { getVoiceConnection } from "@discordjs/voice";
import { deleteMusicPlayer, getMusicPlayer } from "../utils/functions";

export class VoiceStateUpdateHandler implements Handler {
    async handle(oldState: VoiceState, newState: VoiceState) {
        const clientId = oldState.client.user.id;
        const guildId = oldState.guild.id;

        if (oldState.id !== clientId || newState.channelId) {
            return;
        }

        const player = getMusicPlayer(guildId);
        await player.stop();

        deleteMusicPlayer(guildId);

        const connection = getVoiceConnection(guildId);
        connection?.destroy();
    }
}
