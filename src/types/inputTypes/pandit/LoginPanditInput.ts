import { Field, InputType } from "type-graphql";

@InputType()
export class LoginPanditInput {
  @Field()
  userEmail: string;

  @Field()
  password: string;
}
