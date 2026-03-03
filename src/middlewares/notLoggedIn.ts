import { MiddlewareFn } from "type-graphql";
import jwt from "jsonwebtoken";

import { Context, CustomUserJwtPayload } from "../types/context";
import { CustomError } from "../utils/customError";
import { VALID_TOKEN } from "../utils/messages";
import { env } from "../config/env";

export const notLoggedIn: MiddlewareFn<Context> = async ({ context }, next) => {
  const authHeader = context.req.headers["authorization"];

  if (!authHeader) {
    return next(); // ✅ No token → Proceed (User is not logged in)
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(
      token,
      env.ACCESS_TOKEN_SECRET!
    ) as CustomUserJwtPayload;
    context.user = payload;

    // 🔴 Token is valid → Stop execution (User is already logged in)
    throw new CustomError(VALID_TOKEN);
  } catch (error) {
    return next(); //
  }
};
