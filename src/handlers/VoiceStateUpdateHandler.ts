import { Events, VoiceState } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { deleteMusicPlayer, getMusicPlayer } from "../utils/functions";
import { EventHandler } from "../types";

export class VoiceStateUpdateHandler implements EventHandler {
    readonly eventName: Events;

    constructor() {
        this.eventName = Events.VoiceStateUpdate;
    }

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
