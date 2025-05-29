import { InputType, Field } from "type-graphql";

import { PanditStatus } from "../../../utils/enums"; // adjust path as needed

@InputType()
export class SetPanditApprovalStatusInput {
  @Field()
  panditId: string;

  @Field(() => PanditStatus)
  status: PanditStatus;
}
