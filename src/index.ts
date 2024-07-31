import "dotenv/config";
import { marmut } from "./core/client";

async function main() {
    const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

    if (!DISCORD_TOKEN) {
        throw new Error("DISCORD_TOKEN environment variable is undefined");
    }

    await marmut.login(DISCORD_TOKEN);
}

main();
