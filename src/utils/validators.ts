import {
    Guild,
    GuildMember,
    RepliableInteraction,
} from "discord.js";
import { ValidationErrorCode } from "../enums";
import { ValidationError } from "../errors";
import {
    clientInSameVoiceChannelAs,
    clientInVoiceChannelOf,
    clientIsPlayingIn,
    inVoiceChannel,
} from "./functions";

export interface ValidationOptions {
    requireMemberInVoice?: boolean;
    requireClientInVoice?: boolean;
    requireSameVoiceChannel?: boolean;
    requireNotPlayingElsewhere?: boolean;
    requireJoinableChannel?: boolean;
}

export function validateVoiceState(
    interaction: RepliableInteraction,
    options: ValidationOptions = {},
): void {
    const {
        requireMemberInVoice = true,
        requireClientInVoice = false,
        requireSameVoiceChannel = true,
        requireNotPlayingElsewhere = false,
        requireJoinableChannel = false,
    } = options;

    const guild = interaction.guild!;
    const member = interaction.member as GuildMember;

    if (requireMemberInVoice && !inVoiceChannel(member)) {
        throw new ValidationError({
            code: ValidationErrorCode.MEMBER_NOT_IN_VOICE,
        });
    }

    if (requireClientInVoice && !clientInVoiceChannelOf(guild)) {
        throw new ValidationError({
            code: ValidationErrorCode.CLIENT_NOT_IN_VOICE,
        });
    }

    const clientInSameChannel = clientInSameVoiceChannelAs(member);

    if (requireSameVoiceChannel && requireClientInVoice && !clientInSameChannel) {
        throw new ValidationError({
            code: ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE,
        });
    }

    if (requireNotPlayingElsewhere && !clientInSameChannel && clientIsPlayingIn(guild)) {
        throw new ValidationError({
            code: ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE,
        });
    }

    if (requireJoinableChannel && !clientInSameChannel) {
        const voiceChannel = member.voice.channel;
        if (voiceChannel && !voiceChannel.joinable) {
            throw new ValidationError({
                code: ValidationErrorCode.NON_JOINABLE_VOICE_CHANNEL,
            });
        }
    }
}

export function validateMemberInVoice(member: GuildMember): void {
    if (!inVoiceChannel(member)) {
        throw new ValidationError({
            code: ValidationErrorCode.MEMBER_NOT_IN_VOICE,
        });
    }
}

export function validateClientInVoice(guild: Guild): void {
    if (!clientInVoiceChannelOf(guild)) {
        throw new ValidationError({
            code: ValidationErrorCode.CLIENT_NOT_IN_VOICE,
        });
    }
}

export function validateSameVoiceChannel(member: GuildMember): void {
    if (!clientInSameVoiceChannelAs(member)) {
        throw new ValidationError({
            code: ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE,
        });
    }
}
