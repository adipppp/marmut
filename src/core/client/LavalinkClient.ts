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

        this.on("error", (_, err) => {
            console.error(err);
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
