import { marmut } from "../../core/client";
import { clientInVoiceChannel } from "./clientInVoiceChannel";
import { memberInVoiceChannel } from "./memberInVoiceChannel";
import { GuildMember } from "discord.js";

export async function memberInSameVoiceChannel(member: GuildMember) {
    const guild = member.guild;

    if (!memberInVoiceChannel(member) || !clientInVoiceChannel(guild)) {
        return false;
    }

    const clientUserId = marmut.user!.id;
    const cache = guild.voiceStates.cache;
    const memberVoiceChannelId = cache.get(member.id)!.channelId!;
    const clientVoiceChannelId = cache.get(clientUserId)!.channelId!;

    return memberVoiceChannelId === clientVoiceChannelId;
}
