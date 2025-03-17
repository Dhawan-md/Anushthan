import { CustomError } from "../utils/custumError";

import {
  MIN_PASSWORD_LENGTH,
  ONE_LOWER_CASE,
  ONE_NUMERICAL_DIGIT,
  ONE_SPECIAL_CHAR,
  ONE_UPPER_CASE,
} from "../utils/messages";

export const validatePassword = (password: string) => {
  if (password.length < 8) {
    throw new CustomError(MIN_PASSWORD_LENGTH);
  }

  const uppercase = /[A-Z]/;
  const lowercase = /[a-z]/;
  const digit = /\d/;
  const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

  if (!uppercase.test(password)) {
    throw new CustomError(ONE_UPPER_CASE);
  }
  if (!lowercase.test(password)) {
    throw new CustomError(ONE_LOWER_CASE);
  }
  if (!digit.test(password)) {
    throw new CustomError(ONE_NUMERICAL_DIGIT);
  }
  if (!specialChar.test(password)) {
    throw new CustomError(ONE_SPECIAL_CHAR);
  }
};
