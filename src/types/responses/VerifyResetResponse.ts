import { Field, ObjectType } from "type-graphql";

import { resetPasswordToken } from "../globalTypes";
import { BaseResponse } from "../../utils/response";

@ObjectType()
export class VerifyResetResponse extends BaseResponse<resetPasswordToken> {
  @Field(() => resetPasswordToken, { nullable: true })
  declare data: resetPasswordToken;

  constructor(success: boolean, message: string, data: resetPasswordToken) {
    super(success, message, data);
  }
}
