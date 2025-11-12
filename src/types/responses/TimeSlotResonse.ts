import { ObjectType, Field } from "type-graphql";

import { BaseResponse } from "../../utils/response";
import { TimeSlot } from "../../entities/TimeSlot";

@ObjectType()
class TimeSlotResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleTimeSlotResponse extends TimeSlotResponse<TimeSlot> {
  @Field(() => TimeSlot, { nullable: true })
  declare data?: TimeSlot | null;

  constructor(success: boolean, message: string, data?: TimeSlot | null) {
    super(success, message, data);
  }
}

@ObjectType()
export class MultipleTimeSlotResponse extends TimeSlotResponse<TimeSlot[]> {
  @Field(() => [TimeSlot], { nullable: true })
  declare data?: TimeSlot[] | null;

  @Field(() => Number, { nullable: true })
  declare total?: Number | null;

  constructor(
    success: boolean,
    message: string,
    data?: TimeSlot[] | null,
    total?: Number | null
  ) {
    super(success, message, data);
    this.total = total || null;
  }
}
