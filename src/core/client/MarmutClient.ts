import { Client, ClientOptions, Collection, REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { Command } from "../../types";
import { env } from "../../config";

export class MarmutClient extends Client {
    readonly commands: Collection<string, Command>;

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection();
    }

    private async registerListeners() {
        const listenersPath = path.join(__dirname, "..", "..", "listeners");
        const listenerFiles = fs
            .readdirSync(listenersPath)
            .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

        for (const file of listenerFiles) {
            const module = await import(path.join(listenersPath, file));
            const listenerClass = Object.values(module).find(
                (val) => typeof val === "function" && val.prototype?.listen,
            ) as (new (client: MarmutClient) => any) | undefined;

            if (listenerClass) {
                const listener = new listenerClass(this);
                listener.listen();
            }
        }

        this.on("error", console.error);
    }

    private async registerCommands(): Promise<void> {
        const commandsArray = this.commands.map((value) => value.data.toJSON());
        const rest = new REST().setToken(env.discord.token);

        let route;

        if (env.discord.guildId) {
            route = Routes.applicationGuildCommands(
                env.discord.clientId,
                env.discord.guildId,
            );
        } else {
            route = Routes.applicationCommands(env.discord.clientId);
        }

        await rest.put(route, { body: commandsArray });
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, "..", "..", "commands");
        const commandFolders = fs.readdirSync(commandsPath);

        for (const item of commandFolders) {
            const folderPath = path.join(commandsPath, item);
            const stats = fs.statSync(folderPath);

            if (!stats.isDirectory()) continue;

            const commandFiles = fs
                .readdirSync(folderPath)
                .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

            for (const file of commandFiles) {
                const commandModule = await import(path.join(folderPath, file));
                const commandClass = Object.values(commandModule).find(
                    (value) =>
                        typeof value === "function" &&
                        value.prototype !== undefined &&
                        typeof value.prototype.run === "function",
                ) as (new () => Command) | undefined;

                if (!commandClass) {
                    continue;
                }

                const instance = new commandClass();
                this.commands.set(instance.data.name, instance);
            }
        }
    }

    async login(token: string) {
        await this.loadCommands();
        if (env.discord.autoRegisterCommands) {
            await this.registerCommands();
        }
        await this.registerListeners();

        const destroy = this.destroy.bind(this);
        process.on("beforeExit", destroy);
        process.on("SIGINT", destroy);
        process.on("uncaughtException", async (err) => {
            console.error(err);
            await destroy();
            process.exit(1);
        });
        process.on("unhandledRejection", async (err) => {
            console.error(err);
            await destroy();
            process.exit(1);
        });

        return super.login(token);
    }
}
