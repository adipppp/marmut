import { marmut } from "../core/client";
import { Command } from "../types";
import { BaseInteraction, Collection } from "discord.js";

export class InteractionCreateHandler {
    private readonly commands: Collection<string, Command>;

    constructor() {
        this.commands = marmut.commands;
    }

    async handle(interaction: BaseInteraction) {
        if (!interaction.isChatInputCommand()) return;

        const command = this.commands.get(interaction.commandName)!;

        try {
            await command.run(interaction);
        } catch (err) {
            console.error(err);
        }
    }
}
