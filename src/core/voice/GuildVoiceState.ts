import { Guild } from "discord.js";
import { clientIsPlayingIn, leaveVoiceChannel } from "../../utils/functions";

export class GuildVoiceState {
    private readonly guild: Guild;
    private timeout: NodeJS.Timeout | null;

    constructor(guild: Guild) {
        this.guild = guild;
        this.timeout = null;
    }

    shouldTriggerAutoDisconnectTimer() {
        if (this.timeout !== null) {
            return false;
        }
        const clientId = this.guild.client.user.id;
        const voiceState = this.guild.voiceStates.cache.get(clientId);
        if (voiceState === undefined) {
            return false;
        }
        const voiceChannel = voiceState.channel;
        if (voiceChannel === null) {
            return false;
        }
        const members = voiceChannel.members;
        if (members.size > 1) {
            return false;
        }
        return !clientIsPlayingIn(this.guild);
    }

    shouldCancelAutoDisconnectTimer() {
        if (this.timeout === null) {
            return false;
        }
        const clientId = this.guild.client.user.id;
        const voiceState = this.guild.voiceStates.cache.get(clientId);
        if (voiceState === undefined) {
            return false;
        }
        const voiceChannel = voiceState.channel;
        if (voiceChannel === null) {
            return false;
        }
        const members = voiceChannel.members;
        if (members.size > 1) {
            return true;
        }
        return clientIsPlayingIn(this.guild);
    }

    triggerAutoDisconnectTimer() {
        if (this.timeout === null) {
            const guildId = this.guild.id;
            this.timeout = setTimeout(
                () => leaveVoiceChannel(guildId).catch(console.error),
                300000
            );
        }
    }

    cancelAutoDisconnectTimer() {
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}
