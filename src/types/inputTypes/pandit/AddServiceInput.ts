import { InputType, Field } from "type-graphql";
import { IsNotEmpty } from "class-validator";

@InputType()
export class PanditAddServiceInput {
  @Field(() => [String])
  @IsNotEmpty()
  categoryIds: string[];
}
