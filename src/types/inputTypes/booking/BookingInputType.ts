import { InputType, Field, Float } from "type-graphql";

@InputType()
export class BookingInput {
  @Field(() => [String])
  serviceIds: string[];

  @Field()
  scheduledTime: Date;

  @Field()
  location: string;

  @Field(() => Float)
  totalPrice: number;
}