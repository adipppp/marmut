import { Snowflake } from "discord.js";
import { lavalinkClient } from "../../core/client";
import { musicPlayers } from "../../core/managers";

export async function leaveVoiceChannel(guildId: Snowflake) {
    const player = musicPlayers.get(guildId);
    await player?.stop();

    musicPlayers.delete(guildId);

    await lavalinkClient.leaveVoiceChannel(guildId);
}
