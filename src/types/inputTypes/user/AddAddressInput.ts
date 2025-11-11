import { IsPhoneNumber } from "class-validator";
import { Field, Float, InputType } from "type-graphql";

@InputType()
export class AddAddressInput {
  @Field(() => String)
  addressDetails: string;

  @Field(() => String)
  label: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field()
  @IsPhoneNumber("IN")
  phoneNumber: string;
}
