import { ValidationErrorCode } from "../../enums";
import { ValidationError } from "../../errors";

export function getValidationErrorMessage(error: ValidationError) {
    let content;
    switch (error.code) {
        case ValidationErrorCode.MEMBER_NOT_IN_VOICE:
            content = "You need to be in a voice channel to use this command.";
            break;
        case ValidationErrorCode.CLIENT_NOT_IN_VOICE:
            content = "Bot is not connected to any voice channel.";
            break;
        case ValidationErrorCode.MEMBER_NOT_IN_SAME_VOICE:
            content = "You need to be in the same voice channel as the bot.";
            break;
        case ValidationErrorCode.QUEUE_MENU_NOT_FOR_USER:
            content =
                "You cannot interact with this menu. Please create your own by using the /queue command.";
            break;
        case ValidationErrorCode.SEARCH_MENU_NOT_FOR_USER:
            content =
                "You cannot interact with this menu. Please create your own by using the /search command.";
            break;
        case ValidationErrorCode.NON_POSITIVE_SONG_POSITION:
            content = "Position must be greater than 0.";
            break;
        case ValidationErrorCode.INVALID_VOICE_CHANNEL:
            content = "The channel specified is not a voice channel.";
            break;
        case ValidationErrorCode.MISSING_VOICE_CHANNEL:
            content =
                "You need to specify or be in a voice channel to use this command.";
            break;
        case ValidationErrorCode.NON_JOINABLE_VOICE_CHANNEL:
            content = "Unable to connect to the voice channel.";
            break;
    }

    return content;
}
