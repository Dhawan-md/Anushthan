import { InputType, Field } from "type-graphql";

@InputType()
export class GetDocumentInput {
  @Field()
  filePathArray: string;
}
