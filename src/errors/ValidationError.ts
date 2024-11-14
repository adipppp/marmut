import { ValidationErrorCode } from "../enums/ValidationErrorCode";

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
}
