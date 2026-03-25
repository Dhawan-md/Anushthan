import { InputType, Field } from "type-graphql";
import { IsPhoneNumber, Length } from "class-validator";

@InputType()
export class VerifyInputs {
  @Field()
  @IsPhoneNumber("IN")
  phoneNumber: string;

  @Field({ nullable: true })
  @Length(4)
  otpCode?: string;

  @Field({ nullable: true })
  idToken?: string;

  @Field({ nullable: true })
  deviceToken?: string;
}
