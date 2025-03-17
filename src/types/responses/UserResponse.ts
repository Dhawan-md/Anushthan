import { ObjectType, Field } from "type-graphql";

import { User } from "../../entities/User";
import { BaseResponse } from "../../utils/response";
import { AccessToken } from "../globalTypes";


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

  constructor(
    success: boolean,
    message: string,
    data?: User | null,
    accessToken?: AccessToken | null
  ) {
    super(success, message, data);
    this.accessToken = accessToken || null;
  }
}

@ObjectType()
export class MultipleUserResponse extends UserResponse<User[]> {
  @Field(() => [User], { nullable: true })
  declare data?: User[] | null;
}
