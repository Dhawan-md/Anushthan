import { InputType, Field, Float, Int } from "type-graphql";
import { Length, Min } from "class-validator";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";

@InputType()
export class AddServiceInput {
  @Field()
  @Length(2, 100)
  name: string;

  @Field()
  @Length(10, 500)
  description: string;

  @Field(() => Float)
  @Min(0)
  price: number;

  @Field(() => Int)
  @Min(1)
  duration: number;

  @Field()
  categoryId: string;

  @Field(() => GraphQLUpload)
  image: FileUpload;
}
