import { Connectors, NodeOption, Shoukaku } from "shoukaku";
import { Client } from "discord.js";
import { MarmutClient } from "./MarmutClient";

export class LavalinkClient extends Shoukaku {
    private static _instance?: LavalinkClient;
    private readonly _marmutClient: MarmutClient;

    constructor(client: MarmutClient, nodes: NodeOption[]) {
        super(new Connectors.DiscordJS(client), nodes);

        LavalinkClient._instance = this;
        this._marmutClient = client;

        this.on("error", (name, err) => {
            console.error(`[Lavalink] Error on node ${name}:`, err);
        });
        this.on("close", (name, code, reason) => {
            console.warn(
                `[Lavalink] Node ${name} closed with code ${code}: ${reason}`,
            );
        });
        this.on("disconnect", (name, count) => {
            console.warn(
                `[Lavalink] Node ${name} disconnected. Player count: ${count}`,
            );
        });
        this.on("ready", (name) => {
            console.log(`[Lavalink] Node ${name} is ready!`);
        });
    }

    public disconnectAll(): void {
        this.nodes.forEach((node) => node.disconnect(1000));
    }

    async login(token: string): Promise<string> {
        return await this._marmutClient.login(token);
    }

    static get instance(): LavalinkClient {
        if (LavalinkClient._instance === undefined) {
            throw new Error("LavalinkClient has not been initialized yet");
        }
        return LavalinkClient._instance;
    }

    get marmutClient(): MarmutClient {
        return this._marmutClient;
    }
}

// Convenience getters for accessing singletons
export function getLavalinkClient(): LavalinkClient {
    return LavalinkClient.instance;
}

export function getMarmutClient(): MarmutClient {
    return LavalinkClient.instance.marmutClient;
}
