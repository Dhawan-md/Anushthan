import { InputType, Field } from "type-graphql";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  oldPassword!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
