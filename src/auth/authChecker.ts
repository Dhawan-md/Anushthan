import { AuthChecker } from "type-graphql";

import { Context } from "../types/context";
import { AdminRole } from "../utils/enums";

export const authChecker: AuthChecker<Context> = ({ context }, roles) => {
  const { admin, user } = context;

  if (admin && roles.includes(admin.adminRole)) {
    return true; // admin
  }

  if (user && roles.includes(AdminRole.USER)) {
    return true; // User
  }

  return false; // Unauthenticated
};
