import { GuildMember } from "discord.js";

export function memberInVoiceChannel(member: GuildMember) {
    return member.voice.channelId !== null;
}
