import { Field, InputType } from "type-graphql";

import { PaginationInput } from "../PaginationInput";
import { FiltersInput } from "./FiltersInput";

@InputType()
export class GetServiceInput extends PaginationInput {
  @Field(() => FiltersInput, { nullable: true })
  filters?: FiltersInput;
}
