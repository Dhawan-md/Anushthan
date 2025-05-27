import bcrypt from "bcryptjs";

import { ValidatePasswordParams } from "./interfaces";

export const isSamePassword = async (
  params: ValidatePasswordParams
): Promise<boolean> =>
  bcrypt.compare(params.inputPassword, params.hashedPassword);
