import { MusicPlayerErrorCode } from "../enums";

interface MusicPlayerErrorOptions {
    code: MusicPlayerErrorCode;
    message?: string;
}

export class MusicPlayerError extends Error {
    readonly code: MusicPlayerErrorCode;

    constructor(options: MusicPlayerErrorOptions) {
        super(options.message);
        this.code = options.code;
    }

    get message(): string {
        if (super.message !== "") {
            return super.message;
        }

        switch (this.code) {
            case MusicPlayerErrorCode.INVALID_VIDEO_URL:
                return "Invalid video URL.";
            case MusicPlayerErrorCode.PLAYER_NOT_FOUND:
                return "Player not found.";
            case MusicPlayerErrorCode.VOLUME_OUT_OF_RANGE:
                return "Volume must be between 0 and 100.";
            case MusicPlayerErrorCode.SEEK_POSITION_OUT_OF_RANGE:
                return "Seek position is out of range.";
            default:
                return "An unknown error occurred.";
        }
    }
}
