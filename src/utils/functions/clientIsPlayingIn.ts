import { Guild } from "discord.js";
import { musicPlayers } from "../../core/music";

export function clientIsPlayingIn(guild: Guild) {
    const player = musicPlayers.get(guild.id);
    return player !== undefined && !player.isIdle();
}
