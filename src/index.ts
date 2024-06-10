import "dotenv/config";
import { MarmutClient } from "./core/client";
import { GatewayIntentBits } from "discord.js";

const TOKEN = process.env.DISCORD_TOKEN;

function main() {
    if (!TOKEN) {
        throw new Error("DISCORD_TOKEN environment variable is undefined");
    }

    const marmut = new MarmutClient({
        intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds],
    });

    marmut.login(TOKEN);
}

main();
