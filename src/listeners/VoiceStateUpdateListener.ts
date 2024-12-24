import { Client, Snowflake, VoiceState } from "discord.js";
import { ClientEventListener } from "../types";
import { musicPlayers } from "../core/managers";
import { lavalinkClient } from "../core/client";

export class VoiceStateUpdateListener implements ClientEventListener {
    private readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    private async handleChannelLeave(guildId: Snowflake) {
        const player = musicPlayers.get(guildId);
        await player?.stop();

        musicPlayers.delete(guildId);

        await lavalinkClient.leaveVoiceChannel(guildId);
    }

    private async handleEvent(oldState: VoiceState, newState: VoiceState) {
        const clientId = oldState.client.user.id;

        if (oldState.id !== clientId) {
            return;
        }

        const guildId = oldState.guild.id;

        if (newState.channelId === null) {
            await this.handleChannelLeave(guildId);
        }
    }

    listen() {
        this.client.on("voiceStateUpdate", (oldState, newState) =>
            this.handleEvent(oldState, newState).catch(console.error)
        );
    }
}
