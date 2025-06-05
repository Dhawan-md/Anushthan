import { InputType, Field, Float, Int } from "type-graphql";
import { PaymentMethod } from "../../../utils/enums";

@InputType()
export class PlaceBookingInput {
  @Field(() => [String])
  serviceIds: string[];

  @Field()
  location: string;

  @Field()
  timeSlot: Date;

  @Field(() => Float)
  totalPrice: number;

  @Field(() => Int)
  estimatedTime: number;

  @Field({ nullable: true })
  paid: boolean;

  @Field(() => PaymentMethod, { nullable: true })
  paymentMethod: PaymentMethod;

  @Field({ nullable: true })
  transactionId?: string;
}
