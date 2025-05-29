import { InputType, Field } from "type-graphql";
import { IsEmail, Length } from "class-validator";

@InputType()
export class LoginAdminInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(6, 100)
  password: string;
}
