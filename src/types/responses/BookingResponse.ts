import { ObjectType, Field } from "type-graphql";

import { Booking } from "../../entities/Booking";
import { BaseResponse } from "../../utils/response";

@ObjectType()
class BookingResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleBookingResponse extends BaseResponse<Booking> {
  @Field(() => Booking, { nullable: true })
  declare data?: Booking | null;

  constructor(success: boolean, message: string, data?: Booking | null) {
    super(success, message, data);
  }
}

@ObjectType()
export class MultipleBookingResponse extends BookingResponse<Booking[]> {
  @Field(() => [Booking], { nullable: true })
  declare data?: Booking[] | null;

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
    data?: Booking[] | null,
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
