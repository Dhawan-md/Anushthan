import { ObjectType, Field } from "type-graphql";

import { Transaction } from "../../entities/Transaction";
import { BaseResponse } from "../../utils/response";

@ObjectType()
class TransactionResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleTransactionResponse extends BaseResponse<Transaction> {
  @Field(() => Transaction, { nullable: true })
  declare data?: Transaction | null;

  constructor(success: boolean, message: string, data?: Transaction | null) {
    super(success, message, data);
  }
}

@ObjectType()
export class MultipleTransactionResponse extends TransactionResponse<
  Transaction[]
> {
  @Field(() => [Transaction], { nullable: true })
  declare data?: Transaction[] | null;

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
    data?: Transaction[] | null,
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
