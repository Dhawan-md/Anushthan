import { Field, ObjectType } from "type-graphql";

import { BaseResponse } from "../../utils/response";
import { Service } from "../../entities/Service";

@ObjectType()
class ServiceResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleServiceResponse extends ServiceResponse<Service> {
  @Field(() => Service, { nullable: true })
  declare data?: Service | null;

  constructor(success: boolean, message: string, data?: Service | null) {
    super(success, message, data);
  }
}

@ObjectType()
export class MultipleServiceResponse extends ServiceResponse<Service[]> {
  @Field(() => [Service], { nullable: true })
  declare data?: Service[] | null;

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
    data?: Service[] | null,
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
