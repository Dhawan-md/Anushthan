import { decode, JwtPayload, sign } from "jsonwebtoken";
import ms from "ms";

import { logger } from "../utils/logger";
import { CustomError } from "../utils/customError";
import { FAILED_TO_GENERATE_TOKEN } from "../utils/messages";

const getExpirySeconds = (exp?: number, iat?: number) => {
  if (!exp || !iat) throw new CustomError(FAILED_TO_GENERATE_TOKEN);
  return exp - iat; // in seconds
};

const generateJwtToken = <T extends Object>(params: {
  secret: string;
  data?: T;
  expiresIn: string;
}): { token: string; expiresIn: number } => {
  logger.info(`🔐 Generating jwt token.`);

  const payload: Record<string, any> = { ...params.data };
  const token = sign(payload, params.secret as string, {
    expiresIn: params.expiresIn as ms.StringValue,
  });

  const decodedToken = decode(token) as JwtPayload | null;

  if (!decodedToken || !decodedToken.exp || !decodedToken.iat) {
    throw new CustomError(FAILED_TO_GENERATE_TOKEN);
  }
  logger.info(`🔑 Jwt token generated successfully.`);
  return {
    token,
    expiresIn: getExpirySeconds(decodedToken.exp, decodedToken.iat),
  };
};

export const generateAccessToken = <T extends Object>(data: T) =>
  generateJwtToken({
    secret: process.env.ACCESS_TOKEN_SECRET!,
    data,
    expiresIn: "24h",
  });

export const generateRefreshToken = <T extends Object>(data: T) =>
  generateJwtToken({
    secret: process.env.REFRESH_TOKEN_SECRET!,
    data,
    expiresIn: "7d",
  });

export const generateVerificationToken = <T extends Object>(data: T) =>
  generateJwtToken({
    secret: process.env.ACCESS_TOKEN_SECRET!,
    data,
    expiresIn: "15m",
  });
