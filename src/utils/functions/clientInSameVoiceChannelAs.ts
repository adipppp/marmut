import { clientInVoiceChannelOf } from "./clientInVoiceChannelOf";
import { inVoiceChannel } from "./inVoiceChannel";
import { GuildMember } from "discord.js";

export function clientInSameVoiceChannelAs(member: GuildMember) {
    const guild = member.guild;

    if (!inVoiceChannel(member) || !clientInVoiceChannelOf(guild)) {
        return false;
    }

    const clientId = member.client.user.id;
    const cache = guild.voiceStates.cache;
    const memberVoiceChannelId = cache.get(member.id)!.channelId!;
    const clientVoiceChannelId = cache.get(clientId)!.channelId!;

    return memberVoiceChannelId === clientVoiceChannelId;
}
