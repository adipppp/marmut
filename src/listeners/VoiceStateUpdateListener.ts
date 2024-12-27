import { Client, VoiceState } from "discord.js";
import { ClientEventListener } from "../types";
import { guildVoiceStateManager } from "../core/managers";
import { GuildVoiceState } from "../core/voice";
import {
    clientInSameVoiceChannelAs,
    leaveVoiceChannel,
} from "../utils/functions";

export class VoiceStateUpdateListener implements ClientEventListener {
    private readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    private handleGuildVoiceState(guildVoiceState: GuildVoiceState) {
        if (guildVoiceState.shouldTriggerAutoDisconnectTimer()) {
            guildVoiceState.triggerAutoDisconnectTimer();
        } else {
            guildVoiceState.cancelAutoDisconnectTimer();
        }
    }

    private handleChannelLeave(oldState: VoiceState) {
        const clientId = oldState.client.user.id;
        const guild = oldState.guild;
        const guildId = guild.id;
        if (clientId === oldState.id) {
            leaveVoiceChannel(guildId).catch(console.error);
            guildVoiceStateManager.delete(guildId);
            return;
        }
        const clientVoiceState = guild.voiceStates.cache.get(clientId);
        if (clientVoiceState === undefined) {
            return;
        }
        const clientVoiceChannelId = clientVoiceState.channelId;
        if (clientVoiceChannelId === oldState.channelId) {
            return;
        }
        const guildVoiceState = guildVoiceStateManager.get(guildId)!;
        this.handleGuildVoiceState(guildVoiceState);
    }

    private handleChannelJoin(newState: VoiceState) {
        const clientId = newState.client.user.id;
        const guild = newState.guild;
        const member = newState.member!;
        if (clientId === newState.id) {
            const guildVoiceState = new GuildVoiceState(guild);
            guildVoiceStateManager.set(guild.id, guildVoiceState);
            this.handleGuildVoiceState(guildVoiceState);
        } else if (clientInSameVoiceChannelAs(member)) {
            const guildVoiceState = guildVoiceStateManager.get(guild.id)!;
            this.handleGuildVoiceState(guildVoiceState);
        }
    }

    private handleChannelMove(oldState: VoiceState, newState: VoiceState) {
        if (oldState.channelId === newState.channelId) {
            return;
        }
        const clientId = newState.client.user.id;
        const clientVoiceState = newState.guild.voiceStates.cache.get(clientId);
        if (clientVoiceState === undefined) {
            return;
        }
        const clientVoiceChannelId = clientVoiceState.channelId;
        if (
            clientVoiceChannelId === newState.channelId ||
            clientVoiceChannelId === oldState.channelId
        ) {
            const guildId = newState.guild.id;
            const guildVoiceState = guildVoiceStateManager.get(guildId)!;
            this.handleGuildVoiceState(guildVoiceState);
        }
    }

    private handleEvent(oldState: VoiceState, newState: VoiceState) {
        if (newState.channelId === null) {
            this.handleChannelLeave(oldState);
        } else if (oldState.channelId === null) {
            this.handleChannelJoin(oldState);
        } else {
            this.handleChannelMove(oldState, newState);
        }
    }

    listen() {
        this.client.on("voiceStateUpdate", (oldState, newState) => {
            try {
                this.handleEvent(oldState, newState);
            } catch (err) {
                console.error(err);
            }
        });
    }
}
