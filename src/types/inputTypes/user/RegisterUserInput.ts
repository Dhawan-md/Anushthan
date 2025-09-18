import { InputType, Field } from "type-graphql";
import { GraphQLUpload, FileUpload } from "graphql-upload-minimal";
import { IsEmail, IsPhoneNumber, Length } from "class-validator";

@InputType()
export class RegisterUserInput {
  @Field()
  @Length(2, 50)
  name: string;

  @Field()
  @Length(3, 30)
  username: string;

  @Field()
  @IsEmail()
  userEmail: string;

  @Field()
  @IsPhoneNumber('IN')
  phoneNumber: string;

  @Field(() => GraphQLUpload, { nullable: true })
  profileImage?: Promise<FileUpload>;
}
