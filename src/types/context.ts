import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

import { AdminRole, UserRole } from "../utils/enums";

export interface CustomUserJwtPayload extends JwtPayload {
  id: string;
  userRole: UserRole;
}

export interface CustomRefreshJwtPayload extends JwtPayload {
  id: string;
}

export interface CustomAdminJwtPayload extends JwtPayload {
  adminId: string;
  adminRole: AdminRole;
}

export interface Context {
  req: Request;
  res: Response;
  user?: CustomUserJwtPayload | undefined;
  admin?: CustomAdminJwtPayload | undefined;
}
