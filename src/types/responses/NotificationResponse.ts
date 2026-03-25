import { ObjectType, Field } from "type-graphql";
import { Notification } from "../../entities/Notification";
import { BaseResponse } from "../../utils/response";

@ObjectType()
class NotificationResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class MultipleNotificationResponse extends NotificationResponse<Notification[]> {
  @Field(() => [Notification], { nullable: true })
  declare data?: Notification[] | null;

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
    data?: Notification[] | null,
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
