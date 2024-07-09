import { musicPlayers } from "../../core/music";

export function deleteMusicPlayer(guildId: string) {
    return musicPlayers.delete(guildId);
}
