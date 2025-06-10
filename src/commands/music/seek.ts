import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    SharedSlashCommand,
    SlashCommandBuilder,
} from "discord.js";
import { musicPlayers } from "../../core/managers";
import { MusicPlayerErrorCode } from "../../enums";
import { MusicPlayerError } from "../../errors";
import { Command } from "../../types";

export class SeekCommmand implements Command {
    readonly cooldown: number;
    readonly data: SharedSlashCommand;

    constructor() {
        this.cooldown = 3;
        this.data = new SlashCommandBuilder()
            .setName("seek")
            .setDescription("Seeks to a specific position in the current song.")
            .setDMPermission(false)
            .addIntegerOption((builder) =>
                builder
                    .setName("position")
                    .setDescription("Position to seek to in seconds.")
                    .setRequired(true)
            );
    }

    private millisecondsToHHMMSS(ms: number) {
        if (Math.trunc(ms) !== ms) {
            throw new Error("seconds must be an integer");
        }

        if (ms > 86400000) {
            throw new Error("Cannot convert more than 24 hours");
        }

        let seconds = Math.trunc(ms / 1000);
        let minutes = Math.trunc(seconds / 60);
        const hours = Math.trunc(minutes / 60);
        seconds = seconds % 60;
        minutes = minutes % 60;

        const secondsString = seconds.toString().padStart(2, "0");
        const minutesString = minutes.toString().padStart(2, "0");

        let formattedPosition = `${minutesString}:${secondsString}`;

        if (hours > 0) {
            const hoursString = hours.toString().padStart(2, "0");
            formattedPosition = `${hoursString}:${formattedPosition}`;
        }

        return formattedPosition;
    }

    async run(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId!;
        const player = musicPlayers.get(guildId)!;
        const position = interaction.options.getInteger("position", true);

        try {
            await player.seek(position);
        } catch (err) {
            if (err instanceof MusicPlayerError) {
                switch (err.code) {
                    case MusicPlayerErrorCode.SEEK_POSITION_OUT_OF_RANGE: {
                        const content =
                            "The specified position is out of range. Please specify a valid position.";
                        interaction
                            .reply({ content, ephemeral: true })
                            .catch(() => {});
                        break;
                    }
                    default: {
                        const content = "An error has occurred";
                        interaction
                            .reply({ content, ephemeral: true })
                            .catch(() => {});
                        break;
                    }
                }
            }
            throw err;
        }

        const formattedPosition = this.millisecondsToHHMMSS(position * 1000);
        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(
                `:fast_forward:  -  Seeked to ${formattedPosition}`
            );

        await interaction.reply({ embeds: [embed] });
    }
}
