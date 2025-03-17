import { MiddlewareFn } from "type-graphql";

import { logger } from "../utils/logger";

export const loggerMiddlware: MiddlewareFn = async (
  { context: _context, info },
  next
) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  logger.info(
    `GraphQL ${info.parentType.name}.${info.fieldName}- [Duration: ${duration}ms]`
  );

  return result;
};
