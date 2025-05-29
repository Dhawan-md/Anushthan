import { Field, InputType } from "type-graphql";

@InputType()
export class EmailInput {
  @Field()
  userEmail: string;
}
