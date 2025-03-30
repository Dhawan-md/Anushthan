import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

import { UserRole } from "../utils/enums";

export interface CustomJwtPayload extends JwtPayload {
  userId: string;
  isVerified: string;
  userRole: UserRole;
}

export interface Context {
  req: Request;
  res: Response;
  user?: CustomJwtPayload | undefined
}
