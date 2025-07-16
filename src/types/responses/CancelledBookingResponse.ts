import { ObjectType, Field } from "type-graphql";

import { CancelledBooking } from "../../entities/CancelledBooking";
import { BaseResponse } from "../../utils/response";

@ObjectType()
class CancelledBookingResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleCancelledBookingResponse extends BaseResponse<CancelledBooking> {
  @Field(() => CancelledBooking, { nullable: true })
  declare data?: CancelledBooking | null;

  constructor(success: boolean, message: string, data?: CancelledBooking | null) {
    super(success, message, data);
  }
}

@ObjectType()
export class MultipleCancelledBookingResponse extends CancelledBookingResponse<CancelledBooking[]> {
  @Field(() => [CancelledBooking], { nullable: true })
  declare data?: CancelledBooking[] | null;

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
    data?: CancelledBooking[] | null,
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
