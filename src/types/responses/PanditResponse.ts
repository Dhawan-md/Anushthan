import { ObjectType, Field } from "type-graphql";

import { BaseResponse } from "../../utils/response";
import { AccessToken } from "../globalTypes";
import { Pandit } from "../../entities/Pandit";

@ObjectType()
class PanditResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SinglePanditResponse extends PanditResponse<Pandit> {
  @Field(() => Pandit, { nullable: true })
  declare data?: Pandit | null;

  @Field(() => AccessToken, { nullable: true })
  accessToken?: AccessToken | null;

  constructor(
    success: boolean,
    message: string,
    data?: Pandit | null,
    accessToken?: AccessToken | null
  ) {
    super(success, message, data);
    this.accessToken = accessToken || null;
  }
}

@ObjectType()
export class MultiplePanditResponse extends PanditResponse<Pandit[]> {
  @Field(() => [Pandit], { nullable: true })
  declare data?: Pandit[] | null;

  @Field(() => Number, { nullable: true })
  declare total?: Number | null;

  constructor(
    success: boolean,
    message: string,
    data?: Pandit[] | null,
    total?: Number | null
  ) {
    super(success, message, data);
    this.total = total || null;
  }
}
