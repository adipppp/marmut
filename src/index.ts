import "dotenv/config";
import { marmut } from "./core/client";

const TOKEN = process.env.DISCORD_TOKEN;

function main() {
    if (!TOKEN) {
        throw new Error("DISCORD_TOKEN environment variable is undefined");
    }

    marmut.login(TOKEN);
};

main();
