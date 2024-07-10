import { musicPlayers } from "../../core/managers";

export function deleteMusicPlayer(guildId: string) {
    return musicPlayers.delete(guildId);
}
