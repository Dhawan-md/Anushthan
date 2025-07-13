import { InputType, Field } from "type-graphql";

@InputType()
export class FiltersInput {
  @Field({ nullable: true })
  categoryId: string;
}
