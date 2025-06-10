import {
    BaseInteraction,
    ChatInputCommandInteraction,
    Collection,
} from "discord.js";
import { MarmutClient } from "../core/client";
import { cooldowns } from "../core/managers";
import { ClientEventListener } from "../types";

export class InteractionCreateListener implements ClientEventListener {
    private readonly marmutClient: MarmutClient;

    constructor(marmutClient: MarmutClient) {
        this.marmutClient = marmutClient;
    }

    private getRemainingDuration(interaction: ChatInputCommandInteraction) {
        const commandName = interaction.commandName!;
        const userId = interaction.user.id;
        const guildId = interaction.guildId!;
        const compositeId = BigInt(userId) ^ BigInt(guildId);

        const commands = this.marmutClient.commands;

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
        const commands = this.marmutClient.commands;

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

    private async handleEvent(interaction: BaseInteraction) {
        if (!interaction.isChatInputCommand()) return;

        const commandName = interaction.commandName;
        const userId = interaction.user.id;
        const guildId = interaction.guildId!;
        const compositeId = BigInt(userId) ^ BigInt(guildId);

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

    listen() {
        this.marmutClient.on("interactionCreate", (interaction) =>
            this.handleEvent(interaction).catch(console.error)
        );
    }
}
