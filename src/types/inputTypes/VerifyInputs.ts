import { InputType, Field } from "type-graphql";
import { IsEmail, Length } from "class-validator";

@InputType()
export class VerifyInputs {
  @Field()
  @IsEmail()
  userEmail: string;

  @Field()
  @Length(6)
  otpCode: string;
}