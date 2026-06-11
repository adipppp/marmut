import { Snowflake } from "discord.js";
import { getLavalinkClient } from "../../core/client";
import { musicPlayers } from "../../core/managers";

export async function leaveVoiceChannel(guildId: Snowflake): Promise<void> {
    const player = musicPlayers.get(guildId);
    await player?.stop();

    musicPlayers.delete(guildId);

    const lavalinkClient = getLavalinkClient();
    await lavalinkClient.leaveVoiceChannel(guildId);
}
