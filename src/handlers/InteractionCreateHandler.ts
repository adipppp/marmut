import {
    BaseInteraction,
    ChatInputCommandInteraction,
    Collection,
    Events,
} from "discord.js";
import { marmut } from "../core/client";
import { cooldowns } from "../core/managers";
import { EventHandler } from "../types";

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

        const commands = marmut.commands;

        const command = commands.get(commandName)!;
        const commandNames = cooldowns.get(compositeId)!;
        const cooldownStart = commandNames.get(commandName)!;

        return command.cooldown - (Date.now() - cooldownStart) / 1000;
    }

    private setCooldown(commandName: string, compositeId: bigint) {
        let commandNames = cooldowns.get(compositeId);
        if (!commandNames) {
            commandNames = new Collection();
            cooldowns.set(compositeId, commandNames);
        }
        return commandNames.set(commandName, Date.now());
    }

    private deleteCooldown(commandName: string, compositeId: bigint) {
        const commandNames = cooldowns.get(compositeId)!;
        return commandNames.delete(commandName);
    }

    private async deleteCooldownOnTimeout(
        commandName: string,
        compositeId: bigint
    ) {
        const commands = marmut.commands;

        const command = commands.get(commandName)!;
        const cooldownDuration = command.cooldown;

        return await new Promise<boolean>((resolve) =>
            setTimeout(
                () => resolve(this.deleteCooldown(commandName, compositeId)),
                cooldownDuration * 1000
            )
        );
    }

    private isOnCooldown(commandName: string, compositeId: bigint) {
        const commandNames = cooldowns.get(compositeId);
        return commandNames !== undefined && commandNames.has(commandName);
    }

    async handle(interaction: BaseInteraction) {
        if (!interaction.isChatInputCommand()) return;

        const commandName = interaction.commandName;
        const userId = interaction.user.id;
        const guildId = interaction.guildId!;
        const compositeId = BigInt(userId) ^ BigInt(guildId);

        if (this.isOnCooldown(commandName, compositeId)) {
            const duration =
                this.getRemainingDuration(interaction).toPrecision(2);
            await interaction.reply({
                content: `Command is on cooldown. Please try again in ${duration} seconds.`,
                ephemeral: true,
            });
            return;
        }

        const commands = marmut.commands;
        const command = commands.get(commandName)!;

        this.setCooldown(commandName, compositeId);

        try {
            await command.run(interaction);
        } catch (err) {
            this.deleteCooldown(commandName, compositeId);
            throw err;
        }

        await this.deleteCooldownOnTimeout(commandName, compositeId);
    }
}
