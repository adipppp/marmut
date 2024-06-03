import "dotenv/config";
import { MarmutClient } from "./core/MarmutClient";
import { GatewayIntentBits } from "discord.js";

(async () => {
    const token = process.env.DISCORD_TOKEN;

    if (!token) {
        throw new Error("DISCORD_TOKEN environment variable is undefined");
    }

    const client = new MarmutClient({
        intents: [GatewayIntentBits.GuildVoiceStates],
    });

    client.login(token);
})();
