import { clientInVoiceChannel } from "./clientInVoiceChannel";
import { memberInVoiceChannel } from "./memberInVoiceChannel";
import { GuildMember } from "discord.js";

export function memberInSameVoiceChannel(member: GuildMember) {
    const guild = member.guild;

    if (!memberInVoiceChannel(member) || !clientInVoiceChannel(guild)) {
        return false;
    }

    const clientId = member.client.user.id;
    const cache = guild.voiceStates.cache;
    const memberVoiceChannelId = cache.get(member.id)!.channelId!;
    const clientVoiceChannelId = cache.get(clientId)!.channelId!;

    return memberVoiceChannelId === clientVoiceChannelId;
}
