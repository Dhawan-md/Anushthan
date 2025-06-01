import { InputType, Field, Int, Float } from "type-graphql";

@InputType()
export class FiltersInput {
  @Field(() => [String], { nullable: true })
  categoryIds?: string[];

  @Field(() => Float, { nullable: true })
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  maxPrice?: number;

  @Field(() => Int, { nullable: true })
  minDuration?: number;

  @Field(() => Int, { nullable: true })
  maxDuration?: number;
}
