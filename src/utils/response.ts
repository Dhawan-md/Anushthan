import { ObjectType, Field } from "type-graphql";

@ObjectType() // Add this to BaseResponse class to make it compatible with type-graphql
export class BaseResponse<T> {
  @Field()
  success: boolean;

  @Field()
  message: string;

  data?: T | null;

  constructor(success: boolean, message: string, data?: T | null) {
    this.success = success;
    this.message = message;
    this.data = data || null;
  }
}
