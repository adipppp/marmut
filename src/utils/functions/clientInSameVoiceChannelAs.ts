import { GuildMember } from "discord.js";
import { clientInVoiceChannelOf } from "./clientInVoiceChannelOf";
import { inVoiceChannel } from "./inVoiceChannel";

export function clientInSameVoiceChannelAs(member: GuildMember) {
    const guild = member.guild;

    if (!inVoiceChannel(member) || !clientInVoiceChannelOf(guild)) {
        return false;
    }

    const clientId = member.client.user.id;
    const clientVoiceState = guild.voiceStates.cache.get(clientId);
    const memberVoiceChannelId = member.voice.channelId;
    const clientVoiceChannelId = clientVoiceState?.channelId;

    return memberVoiceChannelId === clientVoiceChannelId;
}
