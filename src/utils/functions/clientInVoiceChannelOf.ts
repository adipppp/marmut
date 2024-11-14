import { Guild } from "discord.js";
import { Constants } from "shoukaku";
import { lavalinkClient } from "../../core/client";

export function clientInVoiceChannelOf(guild: Guild) {
    const connection = lavalinkClient.connections.get(guild.id);
    return (
        connection !== undefined &&
        connection.state === Constants.State.CONNECTED
    );
}
