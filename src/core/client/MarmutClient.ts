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
import { ClientReadyHandler, InteractionCreateHandler } from "../../handlers";
import { Command } from "../../types";
import { VoiceStateUpdateHandler } from "../../handlers/VoiceStateUpdateHandler";

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

export class MarmutClient extends Client {
    private readonly commandsArray: RESTPostAPIChatInputApplicationCommandsJSONBody[];
    readonly commands: Collection<string, Command>;

    constructor(options: ClientOptions) {
        super(options);
        this.commandsArray = [];
        this.commands = new Collection();
    }

    private registerListeners() {
        this.once(Events.ClientReady, new ClientReadyHandler().handle);
        this.on(
            Events.InteractionCreate,
            new InteractionCreateHandler(this.commands).handle
        );
        this.on(Events.VoiceStateUpdate, new VoiceStateUpdateHandler().handle);
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
        } catch (err) {
            throw err;
        }

        console.log(
            `Successfully reloaded ${data.length} application (/) commands.`
        );
    }

    async loadCommands() {
        const commandPath = path.join(process.cwd(), "dist", "commands");
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

    async login(token: string) {
        await this.loadCommands();
        await this.registerCommands();
        this.registerListeners();

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
}
