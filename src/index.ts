import { env } from "./config";
import { LavalinkClient, MarmutClient } from "./core/client";
import { GatewayIntentBits } from "discord.js";

async function main() {
    const client = new MarmutClient({
        intents: [
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildScheduledEvents,
            GatewayIntentBits.GuildIntegrations,
            GatewayIntentBits.GuildWebhooks,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildMessageTyping,
            GatewayIntentBits.GuildMessagePolls,
            GatewayIntentBits.GuildExpressions,
            GatewayIntentBits.GuildModeration,
        ],
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
