import { Request, Response } from "express";
import { verify } from "jsonwebtoken";

import { Context, CustomJwtPayload } from "../types/context";
import { logger } from "../utils/logger";

export const context = ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Context => {
  let user: CustomJwtPayload | undefined;

  logger.info(
    `🔄 Incoming request from ${req.ip} at ${new Date().toISOString()}`
  );

  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    try {
      if (token && process.env["JWT_SECRET"]) {
        const payload = verify(
          token,
          process.env["JWT_SECRET"]
        ) as CustomJwtPayload;

        user = payload;
      }
    } catch (error) {
      logger.warn("❌ Invalid token:", error);
    }
  }

  return { req, res, user };
};
