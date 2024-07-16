import { MarmutClient } from "../core/client";
import { cooldowns } from "../core/managers";
import { EventHandler } from "../types";
import {
    BaseInteraction,
    ChatInputCommandInteraction,
    Collection,
    Events,
} from "discord.js";

export class InteractionCreateHandler implements EventHandler {
    readonly eventName: Events;

    constructor() {
        this.eventName = Events.InteractionCreate;
    }

    private getRemainingDuration(interaction: ChatInputCommandInteraction) {
        const commandName = interaction.commandName!;
        const userId = interaction.user.id;
        const guildId = interaction.guildId!;
        const compositeId = BigInt(userId) ^ BigInt(guildId);

        const commands = MarmutClient.getInstance().commands;

        const command = commands.get(commandName)!;
        const commandNames = cooldowns.get(compositeId)!;
        const cooldownStart = commandNames.get(commandName)!;

        return command.cooldown - (Date.now() - cooldownStart) / 1000;
    }

    private isOnCooldown(interaction: ChatInputCommandInteraction) {
        const commandName = interaction.commandName!;
        const userId = interaction.user.id;
        const guildId = interaction.guildId!;
        const compositeId = BigInt(userId) ^ BigInt(guildId);

        let commandNames = cooldowns.get(compositeId);
        if (commandNames === undefined) {
            commandNames = new Collection();
            cooldowns.set(compositeId, commandNames);
        }

        return commandNames.has(commandName);
    }

    private setCooldown(interaction: ChatInputCommandInteraction) {
        const commandName = interaction.commandName!;
        const userId = interaction.user.id;
        const guildId = interaction.guildId!;
        const compositeId = BigInt(userId) ^ BigInt(guildId);

        const commandNames = cooldowns.get(compositeId)!;
        commandNames.set(commandName, Date.now());
    }

    private deleteCooldown(interaction: ChatInputCommandInteraction) {
        const commandName = interaction.commandName!;
        const userId = interaction.user.id;
        const guildId = interaction.guildId!;
        const compositeId = BigInt(userId) ^ BigInt(guildId);

        const commandNames = cooldowns.get(compositeId)!;

        commandNames.delete(commandName);
    }

    private deleteCooldownOnTimeout(interaction: ChatInputCommandInteraction) {
        const commands = MarmutClient.getInstance().commands;

        const commandName = interaction.commandName!;
        const command = commands.get(commandName)!;
        const cooldownDuration = command.cooldown;

        setTimeout(
            () => this.deleteCooldown(interaction),
            cooldownDuration * 1000
        );
    }

    async handle(interaction: BaseInteraction) {
        if (!interaction.isChatInputCommand()) return;

        if (this.isOnCooldown(interaction)) {
            const duration =
                this.getRemainingDuration(interaction).toPrecision(2);
            await interaction.reply({
                content: `Command is on cooldown. Please try again in ${duration} seconds.`,
                ephemeral: true,
            });
            return;
        }

        this.setCooldown(interaction);

        const commands = MarmutClient.getInstance().commands;

        const command = commands.get(interaction.commandName)!;
        try {
            await command.run(interaction);
        } catch (err) {
            this.deleteCooldown(interaction);
            throw err;
        }

        this.deleteCooldownOnTimeout(interaction);
    }
}
