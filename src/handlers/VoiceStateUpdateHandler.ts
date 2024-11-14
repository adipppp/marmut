import { Events, Snowflake, VoiceState } from "discord.js";
import { EventHandler } from "../types";
import { musicPlayers } from "../core/managers";
import { lavalinkClient } from "../core/client";

export class VoiceStateUpdateHandler implements EventHandler {
    readonly eventName: Events;

    constructor() {
        this.eventName = Events.VoiceStateUpdate;
    }

    private async handleChannelLeave(guildId: Snowflake) {
        const player = musicPlayers.get(guildId);
        await player?.stop();

        musicPlayers.delete(guildId);

        await lavalinkClient.leaveVoiceChannel(guildId);
    }

    async handle(oldState: VoiceState, newState: VoiceState) {
        const clientId = oldState.client.user.id;

        if (oldState.id !== clientId) {
            return;
        }

        const guildId = oldState.guild.id;

        if (newState.channelId === null) {
            await this.handleChannelLeave(guildId);
        }
    }
}
