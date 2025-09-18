import { IsPhoneNumber } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class LoginPanditInput {
  @Field()
  @IsPhoneNumber('IN')
  phoneNumber: string;

  @Field()
  password: string;
}
