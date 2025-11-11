import { ObjectType, Field } from "type-graphql";

import { UserLocation } from "../../entities/UserLocation";
import { BaseResponse } from "../../utils/response";

@ObjectType()
class UserLocationResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleUserLocationResponse extends UserLocationResponse<UserLocation> {
  @Field(() => UserLocation, { nullable: true })
  declare data?: UserLocation | null;
}

@ObjectType()
export class MultipleUserLocationResponse extends UserLocationResponse<
  UserLocation[]
> {
  @Field(() => [UserLocation], { nullable: true })
  declare data?: UserLocation[] | null;

  @Field(() => Number, { nullable: true })
  declare total?: Number | null;

  constructor(
    success: boolean,
    message: string,
    data?: UserLocation[] | null,
    total?: Number | null
  ) {
    super(success, message, data);
    this.total = total || null;
  }
}
