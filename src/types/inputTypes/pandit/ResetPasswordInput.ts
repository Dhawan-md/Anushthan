import { Field, InputType } from "type-graphql";

@InputType()
export class ResetPasswordInput {
  @Field()
  newPassword: string;

  @Field()
  otpToken: string;
}