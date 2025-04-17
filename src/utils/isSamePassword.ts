import bcrypt from "bcryptjs";

import { validatePasswordParams } from "./types";

export const isSamePassword = async (
  params: validatePasswordParams
): Promise<Boolean> => {
  const isMatchingPassword = await bcrypt.compare(
    params.inputPassword,
    params.hashedPassword
  );

  if (!isMatchingPassword) {
    return false;
  }

  return true;
};
