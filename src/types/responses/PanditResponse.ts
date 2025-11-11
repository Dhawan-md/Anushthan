import { ObjectType, Field, Float } from "type-graphql";

import { BaseResponse } from "../../utils/response";
import { AccessToken, RefreshToken } from "../globalTypes";
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

  @Field(() => RefreshToken, { nullable: true })
  refreshToken?: RefreshToken | null;

  constructor(
    success: boolean,
    message: string,
    data?: Pandit | null,
    accessToken?: AccessToken | null,
    refreshToken?: RefreshToken | null
  ) {
    super(success, message, data);
    this.accessToken = accessToken || null;
    this.refreshToken = refreshToken || null;
  }
}

@ObjectType()
export class MultiplePanditResponse extends PanditResponse<Pandit[]> {
  @Field(() => [Pandit], { nullable: true })
  declare data?: Pandit[] | null;

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
    data?: Pandit[] | null,
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

@ObjectType()
export class PanditWithDistance {
  @Field(() => String)
  id: string;

  @Field(() => Float)
  distance: number;
}

@ObjectType()
export class NearByPanditResponse extends PanditResponse<PanditWithDistance[]> {
  @Field(() => [PanditWithDistance], { nullable: true })
  declare data: PanditWithDistance[] | null;

  @Field(() => Number, { nullable: true })
  declare total: Number | null;

  constructor(
    success: boolean,
    message: string,
    data?: PanditWithDistance[] | null,
    total?: Number | null
  ) {
    super(success, message, data);
    this.total = total || null;
  }
}
