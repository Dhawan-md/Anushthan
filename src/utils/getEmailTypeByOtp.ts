import { EmailType, OtpType } from "./enums";
import { CustomError } from "./customError";
import { INVALID_OTP_TYPE } from "./messages";

export const getEmailTypeByOtpType = (otpType: OtpType): EmailType => {
  switch (otpType) {
    case OtpType.USER:
      return EmailType.ACCOUNT_VERIFICATION;
    case OtpType.FORGET_PASSWORD:
      return EmailType.FORGET_PASSWORD;
    case OtpType.PANDIT:
      return EmailType.PANDIT_LOGIN;

    default:
      throw new CustomError(INVALID_OTP_TYPE);
  }
};
