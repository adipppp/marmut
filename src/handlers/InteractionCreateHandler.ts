import { MarmutClient } from "../core/MarmutClient";
import { Command } from "../types";
import { BaseInteraction, Collection } from "discord.js";

export class InteractionCreateHandler {
    private readonly commands: Collection<string, Command>;

    constructor(client: MarmutClient) {
        this.commands = client.commands;
    }

    async handle(interaction: BaseInteraction) {
        if (!interaction.isChatInputCommand()) return;

        const command = this.commands.get(interaction.commandName);
        if (!command) {
            throw new Error(`Command ${interaction.commandName} not found`);
        }

        const handle = command.handle;
        try {
            if (handle instanceof Promise) {
                await handle(interaction);
            } else {
                handle(interaction);
            }
        } catch (err) {
            console.error(err);
        }
    }
}
