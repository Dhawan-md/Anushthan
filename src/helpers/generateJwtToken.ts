import { decode, JwtPayload, sign } from "jsonwebtoken";

import { logger } from "../utils/logger";
import { UserRole } from "../utils/enums";
import { CustomError } from "../utils/custumError";
import { FAILED_TO_GENERATE_TOKEN } from "../utils/messages";

export const generateJwtToken = (data: {
  userId: string;
  isVerified: boolean;
  userRole: UserRole;
}): { token: string; expiresIn: number } => {
  logger.info(`🔄 Generating jwt token.`);

  const token = sign(
    {
      userId: data.userId,
      isVeridied: data.isVerified,
      userRole: data.userRole,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "24h" }
  );

  const decodedToken = decode(token) as JwtPayload | null;

  if (!decodedToken || !decodedToken.exp || !decodedToken.iat) {
    throw new CustomError(FAILED_TO_GENERATE_TOKEN);
  }
  logger.info(`✅ Jwt token generated successfully.`);
  return {
    token,
    expiresIn: (decodedToken.exp - decodedToken.iat) / 3600,
  };
};
