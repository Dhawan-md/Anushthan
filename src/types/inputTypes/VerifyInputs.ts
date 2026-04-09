import { InputType, Field } from "type-graphql";
import { IsOptional, IsPhoneNumber, Length } from "class-validator";

@InputType()
export class VerifyInputs {
  @Field()
  @IsPhoneNumber("IN")
  phoneNumber: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(4)
  otpCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  idToken?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  deviceToken?: string;
}
