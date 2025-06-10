import { LavalinkErrorCode } from "../enums";

interface LavalinkErrorOptions {
    code: LavalinkErrorCode;
    message?: string;
}

export class LavalinkError extends Error {
    readonly code: LavalinkErrorCode;

    constructor(options: LavalinkErrorOptions) {
        super(options.message);
        this.code = options.code;
    }

    get message(): string {
        if (super.message !== "") {
            return super.message;
        }

        switch (this.code) {
            case LavalinkErrorCode.NO_AVAILABLE_NODES:
                return "No Lavalink nodes is available.";
            case LavalinkErrorCode.TRACK_NOT_FOUND:
                return "Could not find the song.";
            default:
                return "An unknown error occurred.";
        }
    }
}
