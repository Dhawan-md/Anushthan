// graphql/inputs/RegisterPanditInput.ts
import { InputType, Field, Int } from "type-graphql";
import { GraphQLUpload, FileUpload } from "graphql-upload-minimal";

@InputType()
export class RegisterPanditInput {
  // @Field()
  // password: string;

  @Field(() => [GraphQLUpload])
  documents: Promise<FileUpload>[];

  @Field(() => [String])
  categoryIds: string[];

  @Field(() => Int)
  experience: number;

  @Field(() => String)
  address: string;
}
