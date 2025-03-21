import { CustomError } from "./custumError";
import { INVALID_EMAIL } from "./messages";

const emailRegex =
  /^(?!.*\.\.)[a-zA-Z0-9][a-zA-Z0-9._%+-]{0,63}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateEmail = (userEmail: string) => {

  if (!emailRegex.test(userEmail)) {
    throw new CustomError(INVALID_EMAIL);
  }
};
