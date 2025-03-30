import { MiddlewareFn } from "type-graphql";

import { CustomError } from "../utils/customError";
import { BaseResponse } from "../utils/response";
import { logger } from "../utils/logger";
import { INTERNAL_ERROR_OCCURRED } from "../utils/messages";

export const globalErrorHandler: MiddlewareFn = async (_, next) => {
  try {    
    return await next();
  } catch (error) {
    logger.error("🔥 Error caught:", error);

    if (error instanceof CustomError) {
      return new BaseResponse(false, error.message); // GraphQL doesn't support HTTP status codes
    }

    return new BaseResponse(false, INTERNAL_ERROR_OCCURRED);
  }
};
