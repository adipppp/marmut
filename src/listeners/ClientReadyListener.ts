import { Client } from "discord.js";
import { ClientEventListener } from "../types";

export class ClientReadyListener implements ClientEventListener {
    private readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    private handleEvent(client: Client) {
        console.log(`Ready! Logged in as ${client.user?.tag}`);
    }

    listen() {
        this.client.once("ready", () => {
            try {
                this.handleEvent(this.client);
            } catch (err) {
                console.error(err);
            }
        });
    }
}
