import { Field, InputType } from "type-graphql";

@InputType()
export class UpdatedUserInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  userEmail?: string;

  @Field({ nullable: true })
  phoneNumber?: string;
}
