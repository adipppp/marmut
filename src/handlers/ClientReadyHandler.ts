import { Handler } from "../types";
import { Client } from "discord.js";

export class ClientReadyHandler implements Handler {
    handle(client: Client) {
        console.log(`Ready! Logged in as ${client.user?.tag}`);
    }
}
