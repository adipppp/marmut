import { Events, Snowflake, VoiceState } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { EventHandler } from "../types";
import { musicPlayers } from "../core/managers";
import { MusicPlayer } from "../core/music";

export class VoiceStateUpdateHandler implements EventHandler {
    readonly eventName: Events;

    constructor() {
        this.eventName = Events.VoiceStateUpdate;
    }

    private handleChannelJoin(guildId: Snowflake) {
        const player = new MusicPlayer(guildId);
        musicPlayers.set(guildId, player);
    }

    private async handleChannelLeave(guildId: Snowflake) {
        const player = musicPlayers.get(guildId);
        await player?.stop();

        musicPlayers.delete(guildId);

        const connection = getVoiceConnection(guildId);
        connection?.destroy();
    }

    async handle(oldState: VoiceState, newState: VoiceState) {
        const clientId = oldState.client.user.id;

        if (oldState.id !== clientId) {
            return;
        }

        const guildId = oldState.guild.id;

        if (oldState.channelId === null) {
            this.handleChannelJoin(guildId);
        } else if (newState.channelId === null) {
            this.handleChannelLeave(guildId);
        }
    }
}
