import { GuildMember } from "discord.js";

export function inVoiceChannel(member: GuildMember) {
    return member.voice.channelId !== null;
}
