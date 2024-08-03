import { Snowflake } from "discord.js";
import { MusicPlayer } from "../../core/music";
import { musicPlayers } from "../../core/managers";

export function createMusicPlayer(guildId: Snowflake) {
    const player = new MusicPlayer(guildId);
    musicPlayers.set(guildId, player);
    return player;
}
