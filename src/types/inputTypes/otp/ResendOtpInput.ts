import { InputType, Field } from "type-graphql";
import { IsEnum, IsPhoneNumber } from "class-validator";

import { OtpType } from "../../../utils/enums";

@InputType()
export class ResendOtpInput {
  @Field()
  @IsPhoneNumber()
  phoneNumber: string;

  @Field(() => OtpType)
  @IsEnum(OtpType)
  otpType: OtpType;
}
