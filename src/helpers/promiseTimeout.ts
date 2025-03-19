import { CustomError } from "../utils/custumError";
import { FILE_UPLOAD_FAIL } from "../utils/messages";

export const promiseTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new CustomError(FILE_UPLOAD_FAIL)), timeoutMs)
    ),
  ]);
