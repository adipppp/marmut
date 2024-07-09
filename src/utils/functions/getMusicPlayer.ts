import { Snowflake } from "discord.js";
import { MusicPlayer, musicPlayers } from "../../core/music";

export function getMusicPlayer(guildId: Snowflake) {
    let player = musicPlayers.get(guildId);
    if (!player) {
        player = new MusicPlayer(guildId);
        musicPlayers.set(guildId, player);
    }
    return player;
}
