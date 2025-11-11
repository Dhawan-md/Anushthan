import { OtpType } from "../../utils/enums";

export class ResendOtpDto {
  phoneNumber: string;
  otpType: OtpType;
}
