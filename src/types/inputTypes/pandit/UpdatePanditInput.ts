import { InputType, Field, Int } from "type-graphql";
import { IsOptional, IsNumber } from "class-validator";
import { GraphQLUpload, FileUpload } from "graphql-upload-minimal";

@InputType()
export class UpdatePanditInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  experience?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  categoryIds?: string[];

  @Field(() => [GraphQLUpload], { nullable: true })
  @IsOptional()
  documents?: Promise<FileUpload>[];
  
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  isAvailable?: boolean;
}
