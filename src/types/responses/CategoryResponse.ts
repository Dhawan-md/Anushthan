import { Field, ObjectType } from "type-graphql";

import { BaseResponse } from "../../utils/response";
import { Category } from "../../entities/Category";

@ObjectType()
class CategoryResponse<T> extends BaseResponse<T> {
  declare data?: T | null;
}

@ObjectType()
export class SingleCategoryResponse extends CategoryResponse<Category> {
  @Field(() => Category, { nullable: true })
  declare data?: Category | null;

  constructor(success: boolean, message: string, data?: Category | null) {
    super(success, message, data);
  }
}

@ObjectType()
export class MultipleCategoryResponse extends CategoryResponse<Category[]> {
  @Field(() => [Category], { nullable: true })
  declare data?: Category[] | null;

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
    data?: Category[] | null,
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
