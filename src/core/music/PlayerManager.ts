import { Collection, Snowflake } from "discord.js";
import { MusicPlayer } from "./MusicPlayer";

class PlayerManager extends Collection<Snowflake, MusicPlayer> {
    get(guildId: Snowflake) {
        let player = super.get(guildId);
        if (!player) {
            player = new MusicPlayer(guildId);
            musicPlayers.set(guildId, player);
        }
        return player;
    }
}

export const musicPlayers = new PlayerManager();
