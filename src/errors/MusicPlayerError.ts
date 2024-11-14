import { MusicPlayerErrorCode } from "../enums/MusicPlayerErrorCode";

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
}
