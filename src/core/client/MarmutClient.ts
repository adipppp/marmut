import { Client, ClientOptions, Collection, REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { Command } from "../../types";
import { env } from "../../config";
import { getLavalinkClient } from "./LavalinkClient";

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
            try {
                const module = await import(path.join(listenersPath, file));
                const listenerClass = module.default;

                if (typeof listenerClass === "function" && listenerClass.prototype?.listen) {
                    const listener = new listenerClass(this);
                    listener.listen();
                }
            } catch (err) {
                console.error(`[Listener Loader] Failed to load listener ${file}:`, err);
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

        try {
            await rest.put(route, { body: commandsArray });
        } catch (err) {
            console.error(
                "[Command Registry] Failed to synchronize slash commands with Discord:",
                err,
            );
        }
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
                try {
                    const commandModule = await import(path.join(folderPath, file));
                    const commandClass = commandModule.default;

                    if (typeof commandClass !== "function" || !commandClass.prototype?.run) {
                        continue;
                    }

                    const instance = new commandClass();
                    if (!instance.data?.name) {
                        console.warn(
                            `[Command Loader] Skipping invalid command in ${file}: Missing name.`,
                        );
                        continue;
                    }
                    this.commands.set(instance.data.name, instance);
                } catch (err) {
                    console.error(`[Command Loader] Failed to load command ${file}:`, err);
                }
            }
        }
    }

    async login(token: string) {
        await this.loadCommands();
        if (env.discord.autoRegisterCommands) {
            await this.registerCommands();
        }
        await this.registerListeners();

        const destroy = async () => {
            try {
                const lavalinkClient = getLavalinkClient();
                lavalinkClient.disconnectAll();
            } catch (e) {
                console.error("Failed to disconnect Lavalink nodes:", e);
            }
            try {
                await this.destroy();
            } catch (e) {
                console.error("Failed to destroy Discord client:", e);
            }
        };

        process.on("SIGINT", async () => {
            await destroy();
            process.exit(0);
        });
        process.on("SIGTERM", async () => {
            await destroy();
            process.exit(0);
        });
        process.on("uncaughtException", async (err) => {
            console.error(err);
            await destroy();
            process.exit(1);
        });
        process.on("unhandledRejection", async (err) => {
            console.error("Unhandled Rejection:", err);
        });

        return super.login(token);
    }
}
