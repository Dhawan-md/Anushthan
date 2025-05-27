import { InputType, Field } from "type-graphql";
import { IsEmail, IsEnum } from "class-validator";

import { OtpType } from "../../../utils/enums";

@InputType()
export class ResendOtpInput {
  @Field()
  @IsEmail()
  userEmail: string;

  @Field(() => OtpType)
  @IsEnum(OtpType)
  otpType: OtpType;
}