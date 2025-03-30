import { INTERNAL_ERROR_OCCURRED } from "./messages";

export class CustomError extends Error {
  constructor(orignalError: any) {
    const errorMessage =
      typeof orignalError === "string"
        ? orignalError
        : orignalError && orignalError.message
        ? orignalError.message
        : INTERNAL_ERROR_OCCURRED;

    super(errorMessage);

    // Preserving stack traces if available
    if (orignalError.stack) {
      this.stack = orignalError.stack;
    }

    this.name = this.constructor.name;
  }
}
