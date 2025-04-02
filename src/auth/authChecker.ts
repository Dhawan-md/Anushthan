import { AuthChecker } from "type-graphql";

import { Context } from "../types/context";
import { AdminRole } from "../utils/enums";

export const authChecker: AuthChecker<Context> = ({ context }, roles) => {
  
  if (
    context.admin &&
    roles.includes("SUPERADMIN") &&
    context.admin.adminRole === AdminRole.SUPERADMIN
  ) {
    return true; // Super admin
  }

  if (context.admin && roles.includes("ADMIN")) {
    return true; // Admin
  }

  if (context.user && roles.includes("USER")) {
    return true; // User
  }

  return false; // Unauthenticated
};
