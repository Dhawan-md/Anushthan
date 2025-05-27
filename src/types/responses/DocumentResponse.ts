import { ObjectType, Field } from "type-graphql";
import { BaseResponse } from "../../utils/response";

@ObjectType()
export class MultipleDocumentResponse extends BaseResponse<string[]> {
  @Field(() => [String], { nullable: true })
  declare data?: string[] | null;
}
