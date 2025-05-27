import { OtpType } from "../../utils/enums";

export class ResendOtpDto {
  userEmail: string;
  otpType: OtpType;
}