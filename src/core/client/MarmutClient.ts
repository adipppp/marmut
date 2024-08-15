import {
    Client,
    ClientOptions,
    Collection,
    GatewayIntentBits,
    REST,
    Routes,
} from "discord.js";
import fs from "fs";
import path from "path";
import { Command } from "../../types";

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

class MarmutClient extends Client {
    private static instance: MarmutClient;
    readonly commands: Collection<string, Command>;

    constructor(options: ClientOptions) {
        super(options);
        MarmutClient.instance = this;
        this.commands = new Collection();
    }

    private async registerListeners() {
        const handlersPath = path.join(process.cwd(), "dist", "handlers");
        const handlerFiles = fs
            .readdirSync(handlersPath)
            .filter((file) => file.endsWith(".js"));

        for (const file of handlerFiles) {
            const handler = await import(path.join(handlersPath, file));
            const instance = new handler[Object.keys(handler)[0]]();

            this.on(instance.eventName, async (...args) => {
                try {
                    await instance.handle(...args);
                } catch (err) {
                    console.error(err);
                }
            });
        }

        this.on("error", console.error);
        this.on("debug", console.debug);
    }

    private async registerCommands() {
        if (!TOKEN) {
            throw new Error("DISCORD_TOKEN environment variable is undefined");
        }
        if (!CLIENT_ID) {
            throw new Error("CLIENT_ID environment variable is undefined");
        }

        const commandsArray = this.commands.map((value) => value.data.toJSON());
        const rest = new REST().setToken(TOKEN);

        let route;

        if (GUILD_ID) {
            route = Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);
        } else {
            route = Routes.applicationCommands(CLIENT_ID);
        }

        await rest.put(route, { body: commandsArray });
    }

    async loadCommands() {
        const commandsPath = path.join(process.cwd(), "dist", "commands");
        const commandFolders = fs.readdirSync(commandsPath);

        for (const item of commandFolders) {
            const folderPath = path.join(commandsPath, item);
            const stats = fs.statSync(folderPath);

            if (!stats.isDirectory()) continue;

            const commandFiles = fs
                .readdirSync(folderPath)
                .filter((file) => file.endsWith(".js"));

            for (const file of commandFiles) {
                const command = await import(path.join(folderPath, file));
                const instance = new command[Object.keys(command)[0]]();
                instance.category = item;
                this.commands.set(instance.data.name, instance);
            }
        }
    }

    async login(token: string) {
        await this.loadCommands();
        await this.registerCommands();
        await this.registerListeners();

        const destroy = this.destroy.bind(this);
        process.on("beforeExit", destroy);
        process.on("SIGINT", destroy);
        process.on("uncaughtException", async (err) => {
            console.error(err);
            await destroy();
            process.exit(1);
        });

        return super.login(token);
    }

    static getInstance() {
        return MarmutClient.instance;
    }
}

export const marmut = new MarmutClient({
    intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds],
});
