import { Length } from "class-validator";
import { Field, InputType } from "type-graphql";


@InputType()
export class AddCategoryInput {
  @Field()
  @Length(2, 100)
  name: string;
}
