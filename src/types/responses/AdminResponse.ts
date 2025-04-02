import { ObjectType, Field } from "type-graphql";

import { BaseResponse } from "../../utils/response";
import { AccessToken } from "../globalTypes";
import { Admin } from "../../entities/Admin";

@ObjectType()
class AdminResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleAdminResponse extends AdminResponse<Admin> {
  @Field(() => Admin, { nullable: true })
  declare data?: Admin | null;

  @Field(() => AccessToken, { nullable: true })
  accessToken?: AccessToken | null;

  constructor(
    success: boolean,
    message: string,
    data?: Admin | null,
    accessToken?: AccessToken | null
  ) {
    super(success, message, data);
    this.accessToken = accessToken || null;
  }
}

@ObjectType()
export class MultipleAdminResponse extends AdminResponse<Admin[]> {
  @Field(() => [Admin], { nullable: true })
  declare data?: Admin[] | null;

  @Field(() => Number, { nullable: true })
  declare total?: Number | null;

  constructor(
    success: boolean,
    message: string,
    data?: Admin[] | null,
    total?: Number | null
  ) {
    super(success, message, data);
    this.total = total || null;
  }
}
