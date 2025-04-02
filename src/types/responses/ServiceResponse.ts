import { Field, ObjectType } from "type-graphql";

import { BaseResponse } from "../../utils/response";
import { Service } from "../../entities/Service";

@ObjectType()
export class ServiceResponse extends BaseResponse<Service> {
  @Field(() => Service, { nullable: true })
  declare data?: Service | null;

  constructor(success: boolean, message: string, data?: Service | null) {
    super(success, message, data);
  }
}
