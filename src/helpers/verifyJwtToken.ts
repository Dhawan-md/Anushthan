import { verify, TokenExpiredError } from "jsonwebtoken";
import { env } from "../config/env";
import { CustomError } from "../utils/customError";
import { FAILED_TO_VERIFY_TOKEN } from "../utils/messages";
import {
  CustomRefreshJwtPayload,
  CustomUserJwtPayload,
} from "../types/context";

export const verifyRefreshToken = (token: string): CustomRefreshJwtPayload => {
  const refreshSecret = env.REFRESH_TOKEN_SECRET!;
  try {
    const payload = verify(token, refreshSecret) as CustomRefreshJwtPayload;
    if (!payload) throw new CustomError(FAILED_TO_VERIFY_TOKEN);

    return payload;
  } catch (err: any) {
    if (err instanceof TokenExpiredError) {
      throw new CustomError("Refresh token expired");
    }
    throw new CustomError(FAILED_TO_VERIFY_TOKEN);
  }
};

export const verifyAccessToken = (token: string): CustomUserJwtPayload => {
  const accessSecret = env.ACCESS_TOKEN_SECRET!;
  try {
    const payload = verify(token, accessSecret) as CustomUserJwtPayload;
    if (!payload) throw new CustomError(FAILED_TO_VERIFY_TOKEN);

    return payload;
  } catch (err: any) {
    if (err instanceof TokenExpiredError) {
      throw new CustomError("Access token expired");
    }
    throw new CustomError(FAILED_TO_VERIFY_TOKEN);
  }
};
