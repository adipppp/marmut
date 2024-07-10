import { Snowflake } from "discord.js";
import { MusicPlayer } from "../../core/music";
import { musicPlayers } from "../../core/managers";

export function getMusicPlayer(guildId: Snowflake) {
    let player = musicPlayers.get(guildId);
    if (!player) {
        player = new MusicPlayer(guildId);
        musicPlayers.set(guildId, player);
    }
    return player;
}
