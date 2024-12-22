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
}
