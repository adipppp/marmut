import { env } from "./config";
import { LavalinkClient, MarmutClient } from "./core/client";
import { GatewayIntentBits, Options } from "discord.js";

async function testSonataConnection() {
    const protocol = env.lavalink.isSecure ? "https" : "http";
    const healthUrl = `${protocol}://${env.lavalink.nodeUrl}/health`;

    console.log(`[Sonata] Testing connection to ${healthUrl}...`);

    try {
        const response = await fetch(healthUrl, {
            headers: {
                Authorization: env.lavalink.nodeAuth,
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[Sonata] Connection successful! Version: ${data.version}`);
            return true;
        }

        console.error(`[Sonata] Connection failed with status: ${response.status}`);
    } catch (err: any) {
        console.error(`[Sonata] Connection error: ${err.message}`);
    }

    return false;
}

async function main() {
    // Test connection to Sonata before starting
    const isSonataReady = await testSonataConnection();
    if (!isSonataReady) {
        console.error("[Sonata] Critical: Could not connect to Sonata audio server. Exiting...");
        process.exit(1);
    }

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
