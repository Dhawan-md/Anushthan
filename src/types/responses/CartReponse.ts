import { Field, ObjectType } from "type-graphql";

import { BaseResponse } from "../../utils/response";
import { Cart } from "../../entities/Cart";

@ObjectType()
class CartResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleCartResponse extends CartResponse<Cart> {
  @Field(() => Cart, { nullable: true })
  declare data?: Cart | null;

  constructor(success: boolean, message: string, data?: Cart | null) {
    super(success, message, data);
  }
}

@ObjectType()
export class MultipleCartResponse extends CartResponse<Cart> {
  @Field(() => Cart, { nullable: true })
  declare data?: Cart | null;

  @Field(() => Number, { nullable: true })
  declare total?: Number | null;

  constructor(
    success: boolean,
    message: string,
    data?: Cart | null,
    total?: Number | null
  ) {
    super(success, message, data);
    this.total = total || null;
  }
}
