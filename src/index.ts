import "dotenv/config";
import { MarmutClient } from "./core/client";
import { GatewayIntentBits } from "discord.js";

async function main() {
    const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

    if (!DISCORD_TOKEN) {
        throw new Error("DISCORD_TOKEN environment variable is undefined");
    }

    const marmut = new MarmutClient({
        intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds],
    });

    await marmut.login(DISCORD_TOKEN);
}

main();
