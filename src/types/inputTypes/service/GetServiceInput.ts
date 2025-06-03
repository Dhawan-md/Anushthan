import { Field, InputType } from "type-graphql";

import { PaginationInput } from "../PaginationInput";
import { FiltersInput } from "./FiltersInput";

@InputType()
export class GetServicesInput extends PaginationInput {
  @Field(() => FiltersInput, { nullable: true })
  filters?: FiltersInput;
}
