import { InputType, Field } from "type-graphql";
import { PaginationInput } from "../PaginationInput";
import { PanditStatus } from "../../../utils/enums";

@InputType()
export class GetAllPanditsInput extends PaginationInput {
  @Field(() => PanditStatus, { nullable: true })
  status?: PanditStatus;
}
