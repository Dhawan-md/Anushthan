import { Field, InputType } from "type-graphql";

@InputType()
export class SetPasswordInput {
  @Field()
  panditId: string;

  @Field()
  password: string;
}
