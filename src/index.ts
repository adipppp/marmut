import "dotenv/config";
import { lavalinkClient, marmut } from "./core/client";

async function main() {
    const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

    if (!DISCORD_TOKEN) {
        throw new Error("DISCORD_TOKEN environment variable is undefined");
    }

    lavalinkClient;

    await marmut.login(DISCORD_TOKEN);
}

main();
