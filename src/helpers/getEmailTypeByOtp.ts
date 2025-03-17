import { EmailType, OtpType } from "../utils/enums";
import { CustomError } from "../utils/custumError";
import { INVALID_OTP_TYPE } from "../utils/messages";

export const getEmailTypeByOtpType = (otpType: OtpType): EmailType => {
  switch (otpType) {
    case OtpType.USER:
      return EmailType.ACCOUNT_VERIFICATION;
    case OtpType.FORGET_PASSWORD:
      return EmailType.FORGET_PASSWORD;

    default:
      throw new CustomError(INVALID_OTP_TYPE);
  }
};
