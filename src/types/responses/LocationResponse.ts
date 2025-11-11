import { ObjectType, Field, Float } from "type-graphql";

import { BaseResponse } from "../../utils/response";

@ObjectType()
export class LocationResponse extends BaseResponse<String> {
  @Field(() => String, { nullable: true })
  declare data?: String | null;
}

@ObjectType()
export class LocationSuggestionResponse {
  @Field()
  description!: string;

  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;
}
