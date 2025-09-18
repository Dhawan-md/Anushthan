import { InputType, Field } from "type-graphql";
import { Length } from "class-validator";

@InputType()
export class VerifyInputs {
  @Field()
  phoneNumber: string;

  @Field()
  @Length(4)
  otpCode: string;
}
