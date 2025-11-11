import { Request, Response } from "express";
import { verify } from "jsonwebtoken";

import {
  Context,
  CustomAdminJwtPayload,
  CustomUserJwtPayload,
} from "../types/context";
import { logger } from "../utils/logger";
import { CustomError } from "../utils/customError";
import { INVALID_TOKEN } from "../utils/messages";

export const context = ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Context => {
  let user: CustomUserJwtPayload | undefined;
  let admin: CustomAdminJwtPayload | undefined;

  logger.info(
    `🔄 Incoming request from ${req.ip} at ${new Date().toISOString()}`
  );

  const userAuthHeader = req.headers["authorization"];
  const adminAuthHeader = req.headers["admin-authorization"] as string;

  if (userAuthHeader) {
    const token = userAuthHeader.split(" ")[1];

    try {
      if (token && process.env["ACCESS_TOKEN_SECRET"]) {
        const payload = verify(
          token,
          process.env["ACCESS_TOKEN_SECRET"]
        ) as CustomUserJwtPayload;

        user = payload;
      }
    } catch (error) {
      logger.warn("❌ Invalid token:", error);
      throw new CustomError(INVALID_TOKEN);
    }
  }

  if (adminAuthHeader) {
    const token = adminAuthHeader.split(" ")[1];

    try {
      if (token && process.env["ACCESS_TOKEN_SECRET"]) {
        const payload = verify(
          token,
          process.env["ACCESS_TOKEN_SECRET"]
        ) as CustomAdminJwtPayload;

        admin = payload;
      }
    } catch (error) {
      logger.warn("❌ Invalid token:", error);
      throw new CustomError(INVALID_TOKEN);
    }
  }

  return { req, res, user, admin };
};
