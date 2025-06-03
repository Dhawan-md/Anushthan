import { InputType, Field } from "type-graphql";

@InputType()
export class FiltersInput {
  @Field({ nullable: true })
  categoryId: string;

  // @Field(() => Float, { nullable: true })
  // minPrice?: number;

  // @Field(() => Float, { nullable: true })
  // maxPrice?: number;

  // @Field(() => Int, { nullable: true })
  // minDuration?: number;

  // @Field(() => Int, { nullable: true })
  // maxDuration?: number;
}
