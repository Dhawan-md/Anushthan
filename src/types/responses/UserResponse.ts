import { ObjectType, Field } from "type-graphql";

import { User } from "../../entities/User";
import { BaseResponse } from "../../utils/response";
import { AccessToken, RefreshToken } from "../globalTypes";

@ObjectType()
class UserResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleUserResponse extends UserResponse<User> {
  @Field(() => User, { nullable: true })
  declare data?: User | null;

  @Field(() => AccessToken, { nullable: true })
  accessToken?: AccessToken | null;

  @Field(() => RefreshToken, { nullable: true })
  refreshToken?: RefreshToken | null;

  @Field(() => String, { nullable: true })
  deviceToken?: string | null;

  constructor(
    success: boolean,
    message: string,
    data?: User | null,
    accessToken?: AccessToken | null,
    refreshToken?: RefreshToken | null,
    deviceToken?: string | null
  ) {
    super(success, message, data);
    this.accessToken = accessToken || null;
    this.refreshToken = refreshToken || null;
    this.deviceToken = deviceToken || null;
  }
}

@ObjectType()
export class MultipleUserResponse extends UserResponse<User[]> {
  @Field(() => [User], { nullable: true })
  declare data?: User[] | null;

  @Field(() => Number, { nullable: true })
  declare total?: Number | null;

  @Field(() => Number, { nullable: true })
  declare page?: Number | null;

  @Field(() => Number, { nullable: true })
  declare limit?: Number | null;

  @Field(() => Number, { nullable: true })
  declare totalPages?: Number | null;

  constructor(
    success: boolean,
    message: string,
    data?: User[] | null,
    total?: Number | null,
    page?: Number | null,
    limit?: Number | null,
    totalPages?: Number | null
  ) {
    super(success, message, data);
    this.total = total || null;
    this.page = page || null;
    this.limit = limit || null;
    this.totalPages = totalPages || null;
  }
}
