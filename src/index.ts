import { env } from "./config";
import { LavalinkClient, MarmutClient } from "./core/client";
import { GatewayIntentBits, Options } from "discord.js";

async function main() {
    const client = new MarmutClient({
        intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds],
        makeCache: Options.cacheWithLimits({
            MessageManager: 0,
            PresenceManager: 0,
        }),
    });

    const nodes = [
        {
            name: env.lavalink.nodeName,
            url: env.lavalink.nodeUrl,
            auth: env.lavalink.nodeAuth,
            secure: env.lavalink.isSecure,
        },
    ];
    const lavalinkClient = new LavalinkClient(client, nodes);

    await lavalinkClient.login(env.discord.token);
}

main();
