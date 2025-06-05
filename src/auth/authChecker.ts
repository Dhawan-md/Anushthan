import { AuthChecker } from "type-graphql";

import { Context } from "../types/context";

export const authChecker: AuthChecker<Context> = ({ context }, roles) => {
  const { admin, user } = context;

  if (admin && roles.includes(admin.adminRole)) {
    return true; // admin
  }

  if (user && roles.includes(user.userRole)) {
    return true; // User
  }

  return false; // Unauthenticated
};
