import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    Guild,
    GuildMember,
    Snowflake,
} from "discord.js";
import { musicPlayers } from "../../core/managers";
import { MusicPlayer } from "../../core/music";
import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";

type GuildInteraction = ChatInputCommandInteraction | ButtonInteraction;

interface MusicCommandContext {
    guild: Guild;
    member: GuildMember;
}

type InteractionWithMember = GuildInteraction & {
    member: GuildMember | null;
};

export function getMusicCommandContext(
    interaction: GuildInteraction,
): MusicCommandContext {
    const guild = interaction.guild;
    if (guild === null) {
        throw new Error("This command can only be used in a server.");
    }

    const member = (interaction as InteractionWithMember).member;
    if (member === null || member.voice === undefined) {
        throw new Error("Unable to resolve your member state in this server.");
    }

    return { guild, member };
}

export function getGuildMusicPlayer(guildId: Snowflake): MusicPlayer {
    const player = musicPlayers.get(guildId);
    if (player === undefined) {
        throw new ValidationError({
            code: ValidationErrorCode.CLIENT_NOT_IN_VOICE,
        });
    }

    return player;
}

export function assertPlayerIsPlaying(player: MusicPlayer): void {
    if (!player.isPlaying()) {
        throw new Error("There is no song playing.");
    }
}
