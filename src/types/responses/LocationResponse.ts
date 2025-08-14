import { ObjectType, Field } from "type-graphql";

import { BaseResponse } from "../../utils/response";

@ObjectType()
export class LocationResponse extends BaseResponse<String> {
  @Field(() => String, { nullable: true })
  declare data?: String | null;
}
