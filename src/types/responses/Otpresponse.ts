import { Field, ObjectType } from "type-graphql";

import { OtpToken } from "../globalTypes";
import { BaseResponse } from "../../utils/response";

@ObjectType()
export class OtpResponse extends BaseResponse<OtpToken> {
  @Field(() => OtpToken, { nullable: true })
  declare data?: OtpToken | null;

  constructor(success: boolean, message: string, data?: OtpToken | null) {
    super(success, message, data);
  }
}
