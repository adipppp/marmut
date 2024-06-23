import { Command, Handler } from "../types";
import { BaseInteraction, Collection } from "discord.js";

export class InteractionCreateHandler implements Handler {
    private readonly commands: Collection<string, Command>;

    constructor(commands: Collection<string, Command>) {
        this.commands = commands;
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
