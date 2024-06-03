import {
    Client,
    ClientOptions,
    Collection,
    Events,
    REST,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    Routes,
} from "discord.js";
import fs from "fs";
import path from "path";
import { ClientReadyHandler, InteractionCreateHandler } from "../handlers";
import { Command } from "../types";

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

export class MarmutClient extends Client {
    private commandsArray: RESTPostAPIChatInputApplicationCommandsJSONBody[];
    commands: Collection<string, Command>;

    constructor(options: ClientOptions) {
        super(options);
        this.commandsArray = [];
        this.commands = new Collection();
    }

    private async registerCommands() {
        if (!TOKEN) {
            throw new Error("DISCORD_TOKEN environment variable is undefined");
        }
        if (!CLIENT_ID) {
            throw new Error("CLIENT_ID environment variable is undefined");
        }

        const commands = this.commands;
        const rest = new REST().setToken(TOKEN);

        let route;

        if (GUILD_ID) {
            route = Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);
        } else {
            route = Routes.applicationCommands(CLIENT_ID);
        }

        console.log(
            `Started refreshing ${commands.size} application (/) commands.`
        );

        let data: unknown[];

        try {
            data = (await rest.put(route, {
                body: this.commandsArray,
            })) as unknown[];
        } catch (error) {
            throw error;
        }

        console.log(
            `Successfully reloaded ${data.length} application (/) commands.`
        );
    }

    async loadCommands() {
        const commandPath = path.join(__dirname, "..", "commands");
        const commandFolders = fs.readdirSync(commandPath);

        for (const folder of commandFolders) {
            const commandFiles = fs
                .readdirSync(path.join(commandPath, folder))
                .filter((file) => file.endsWith(".js"));

            for (const file of commandFiles) {
                const command = await import(
                    path.join(commandPath, folder, file)
                );
                const instance = new command[Object.keys(command)[0]]();

                this.commands.set(instance.data.name, instance);
                this.commandsArray.push(instance.data.toJSON());
            }
        }
    }

    private registerListeners() {
        this.once(Events.ClientReady, new ClientReadyHandler().handle);
        this.on(
            Events.InteractionCreate,
            new InteractionCreateHandler(this).handle
        );
    }

    async login(token: string) {
        await this.loadCommands();
        await this.registerCommands();
        this.registerListeners();
        return await super.login(token);
    }
}
