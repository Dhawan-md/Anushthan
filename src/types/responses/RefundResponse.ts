import { ObjectType, Field } from "type-graphql";

import { Refund } from "../../entities/Refund";
import { BaseResponse } from "../../utils/response";

@ObjectType()
class RefundResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleRefundResponse extends BaseResponse<Refund> {
  @Field(() => Refund, { nullable: true })
  declare data?: Refund | null;

  constructor(success: boolean, message: string, data?: Refund | null) {
    super(success, message, data);
  }
}

@ObjectType()
export class MultipleRefundResponse extends RefundResponse<Refund[]> {
  @Field(() => [Refund], { nullable: true })
  declare data?: Refund[] | null;

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
    data?: Refund[] | null,
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
