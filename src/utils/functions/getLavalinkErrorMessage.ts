import { LavalinkErrorCode } from "../../enums";
import { LavalinkError } from "../../errors";

export function getLavalinkErrorMessage(error: LavalinkError) {
    let content;
    switch (error.code) {
        case LavalinkErrorCode.NO_AVAILABLE_NODES:
            content = "No Lavalink nodes is available.";
            break;
        case LavalinkErrorCode.TRACK_NOT_FOUND:
            content = "Could not find the song.";
            break;
    }

    return content;
}
