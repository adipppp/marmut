import { VoiceBasedChannel } from "discord.js";
import { musicPlayers } from "../../core/managers";
import { MusicPlayer } from "../../core/music";
import { getLavalinkClient } from "../../core/client";

export async function joinVoiceChannel(
    channel: VoiceBasedChannel,
): Promise<void> {
    const lavalinkClient = getLavalinkClient();
    const guild = channel.guild;
    const guildId = guild.id;
    const channelId = channel.id;

    const existingMusicPlayer = musicPlayers.get(guildId);
    
    if (existingMusicPlayer && guild.members.me?.voice.channelId === channelId) {
        return;
    }

    const player = await lavalinkClient.joinVoiceChannel({
        guildId,
        channelId,
        shardId: guild.shardId,
        deaf: true,
    });

    if (!existingMusicPlayer) {
        const musicPlayer = new MusicPlayer(guildId, player);
        musicPlayers.set(guildId, musicPlayer);
    }
}
