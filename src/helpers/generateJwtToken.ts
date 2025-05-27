import { decode, JwtPayload, sign } from "jsonwebtoken";
import ms from "ms";

import { logger } from "../utils/logger";
import { CustomError } from "../utils/customError";
import { FAILED_TO_GENERATE_TOKEN } from "../utils/messages";

export const generateJwtToken = <T extends Object>(
  data: T,
  expiresIn: string = "24h"
): { token: string; expiresIn: number } => {
  logger.info(`🔐 Generating jwt token.`);

  const payload: Record<string, any> = { ...data };
  const token = sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: expiresIn as ms.StringValue,
  });

  const decodedToken = decode(token) as JwtPayload | null;

  if (!decodedToken || !decodedToken.exp || !decodedToken.iat) {
    throw new CustomError(FAILED_TO_GENERATE_TOKEN);
  }
  logger.info(`🔑 Jwt token generated successfully.`);
  return {
    token,
    expiresIn: (decodedToken.exp - decodedToken.iat) / 3600,
  };
};
