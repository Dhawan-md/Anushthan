import { CustomError } from "./customError";
import { logger } from "./logger";
import { FILE_UPLOAD_FAIL } from "./messages";

export const promiseTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  const start = Date.now();

  try {
    const result = await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new CustomError(FILE_UPLOAD_FAIL)), timeoutMs)
      ),
    ]);

    logger.info(`✅ Upload finished in ${Date.now() - start}ms`);
    return result;
  } catch (error) {
    logger.error(`⛔ Upload failed after ${Date.now() - start}ms`, error);
    throw error;
  }
};
