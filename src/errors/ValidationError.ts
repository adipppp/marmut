import { ValidationErrorCode } from "../enums";

interface ValidationErrorOptions {
    code: ValidationErrorCode;
    message?: string;
}

export class ValidationError extends Error {
    readonly code: ValidationErrorCode;

    constructor(options: ValidationErrorOptions) {
        super(options.message);
        this.code = options.code;
    }

    get message(): string {
        if (super.message !== "") {
            return super.message;
        }

        switch (this.code) {
            case ValidationErrorCode.MEMBER_NOT_IN_VOICE:
                return "You need to be in a voice channel to use this command.";
            case ValidationErrorCode.CLIENT_NOT_IN_VOICE:
                return "Bot is not connected to any voice channel.";
            case ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE:
                return "You need to be in the same voice channel as the bot.";
            case ValidationErrorCode.QUEUE_MENU_NOT_FOR_USER:
                return "You cannot interact with this menu. Please create your own by using the /queue command.";
            case ValidationErrorCode.SEARCH_MENU_NOT_FOR_USER:
                return "You cannot interact with this menu. Please create your own by using the /search command.";
            case ValidationErrorCode.NON_POSITIVE_SONG_POSITION:
                return "Position must be greater than 0.";
            case ValidationErrorCode.INVALID_VOICE_CHANNEL:
                return "The channel specified is not a voice channel.";
            case ValidationErrorCode.MISSING_VOICE_CHANNEL:
                return "You need to specify or be in a voice channel to use this command.";
            case ValidationErrorCode.NON_JOINABLE_VOICE_CHANNEL:
                return "Unable to connect to the voice channel.";
            default:
                return "An unknown error occurred.";
        }
    }
}
