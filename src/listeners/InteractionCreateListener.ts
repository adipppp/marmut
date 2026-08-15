import {
    BaseInteraction,
    ChatInputCommandInteraction,
    Collection,
} from "discord.js";
import { MarmutClient } from "../core/client";
import { cooldowns } from "../core/managers";
import { ClientEventListener } from "../types";

export default class InteractionCreateListener implements ClientEventListener {
    private readonly marmutClient: MarmutClient;

    constructor(marmutClient: MarmutClient) {
        this.marmutClient = marmutClient;
    }

    private getRemainingDuration(interaction: ChatInputCommandInteraction) {
        const commandName = interaction.commandName;
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        if (!guildId) return 0;
        const compositeId = `${userId}-${guildId}`;

        const commands = this.marmutClient.commands;

        const command = commands.get(commandName);
        if (!command) return 0;
        const commandNames = cooldowns.get(compositeId);
        if (!commandNames) return 0;
        const cooldownStart = commandNames.get(commandName);
        if (cooldownStart === undefined) return 0;

        return command.cooldown - (Date.now() - cooldownStart) / 1000;
    }

    private setCooldown(commandName: string, compositeId: string) {
        let commandNames = cooldowns.get(compositeId);
        if (!commandNames) {
            commandNames = new Collection();
            cooldowns.set(compositeId, commandNames);
        }
        return commandNames.set(commandName, Date.now());
    }

    private deleteCooldown(commandName: string, compositeId: string) {
        const commandNames = cooldowns.get(compositeId);
        if (!commandNames) return false;
        const deleted = commandNames.delete(commandName);
        if (commandNames.size === 0) {
            cooldowns.delete(compositeId);
        }
        return deleted;
    }

    private scheduleCooldownDeletion(
        commandName: string,
        compositeId: string,
    ) {
        const commands = this.marmutClient.commands;

        const command = commands.get(commandName);
        if (!command) return;
        const cooldownDuration = command.cooldown;

        setTimeout(
            () => this.deleteCooldown(commandName, compositeId),
            cooldownDuration * 1000,
        );
    }

    private isOnCooldown(commandName: string, compositeId: string) {
        const commandNames = cooldowns.get(compositeId);
        return commandNames !== undefined && commandNames.has(commandName);
    }

    private async handleEvent(interaction: BaseInteraction) {
        if (!interaction.isChatInputCommand()) return;

        const commandName = interaction.commandName;
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        if (!guildId) return;
        const compositeId = `${userId}-${guildId}`;

        if (this.isOnCooldown(commandName, compositeId)) {
            const remainingDuration = this.getRemainingDuration(interaction);
            if (remainingDuration > 0) {
                const durationString = remainingDuration.toPrecision(2);
                await interaction.reply({
                    content: `Command is on cooldown. Please try again in ${durationString} seconds.`,
                    ephemeral: true,
                });
            }
            return;
        }

        const commands = this.marmutClient.commands;
        const command = commands.get(commandName);
        if (!command) {
            console.warn(
                `[InteractionCreate] Received unknown command: "${commandName}". Ignoring.`,
            );
            return;
        }

        this.setCooldown(commandName, compositeId);
        this.scheduleCooldownDeletion(commandName, compositeId);

        try {
            await command.run(interaction);
        } catch (err) {
            this.deleteCooldown(commandName, compositeId);
            throw err;
        }
    }

    listen() {
        this.marmutClient.on("interactionCreate", (interaction) =>
            this.handleEvent(interaction).catch(console.error),
        );
    }
}
