import { VoiceBasedChannel } from "discord.js";
import { musicPlayers } from "../../core/managers";
import { MusicPlayer } from "../../core/music";
import { lavalinkClient } from "../../core/client";

export async function joinVoiceChannel(channel: VoiceBasedChannel) {
    const guild = channel.guild;
    const guildId = guild.id;
    const channelId = channel.id;
    const player = await lavalinkClient.joinVoiceChannel({
        guildId,
        channelId,
        shardId: 0,
        deaf: true,
    });
    const musicPlayer = await MusicPlayer.create(guildId, player);
    musicPlayers.set(guildId, musicPlayer);
}
