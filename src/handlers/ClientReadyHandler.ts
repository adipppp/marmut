import { Client, Events } from "discord.js";
import { EventHandler } from "../types";

export class ClientReadyHandler implements EventHandler {
    readonly eventName: Events;
    readonly once: boolean;

    constructor() {
        this.eventName = Events.ClientReady;
        this.once = true;
    }

    handle(client: Client) {
        console.log(`Ready! Logged in as ${client.user?.tag}`);
    }
}
