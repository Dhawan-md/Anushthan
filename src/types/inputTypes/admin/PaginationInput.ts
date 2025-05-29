import { InputType, Field, Int } from "type-graphql";
import { IsOptional, Min } from "class-validator";

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  limit?: number;
}
