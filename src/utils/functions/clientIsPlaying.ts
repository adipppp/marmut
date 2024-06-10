import { Snowflake } from "discord.js";
import { musicPlayers } from "../../core/music";

export function clientIsPlaying(guildId: Snowflake) {
    const player = musicPlayers.get(guildId);
    return player && player.isPlaying();
}
