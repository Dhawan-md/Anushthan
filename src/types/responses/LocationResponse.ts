import { ObjectType, Field, Float } from "type-graphql";

import { BaseResponse } from "../../utils/response";
import { UserLocation } from "../../entities/UserLocation";

@ObjectType()
export class LocationResponse extends BaseResponse<UserLocation> {
  @Field(() => UserLocation, { nullable: true })
  declare data?: UserLocation | null;
}

export class LocationCordinateResponse extends BaseResponse<String> {
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
