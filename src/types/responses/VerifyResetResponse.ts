import { Field, ObjectType } from "type-graphql";

import { AccessToken } from "../globalTypes";
import { BaseResponse } from "../../utils/response";

@ObjectType()
export class VerifyResetResponse extends BaseResponse<AccessToken> {
  @Field(() => AccessToken, { nullable: true })
  declare data: AccessToken;

  constructor(success: boolean, message: string, data: AccessToken) {
    super(success, message, data);
  }
}
