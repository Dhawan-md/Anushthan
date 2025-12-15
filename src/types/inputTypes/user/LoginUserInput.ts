import { IsPhoneNumber } from "class-validator";
import { InputType, Field } from "type-graphql";

@InputType()
export class LoginUserInput {
  @Field()
  @IsPhoneNumber("IN")
  phoneNumber: string;

  @Field()
  deviceToken: string;
}
