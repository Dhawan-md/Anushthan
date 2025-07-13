import { InputType, Field, Float, Int } from "type-graphql";

import { PaymentType } from "../../../utils/enums";

@InputType()
export class PlaceBookingInput {
  @Field(() => [String])
  serviceIds: string[];

  @Field()
  categoryId: string;

  @Field()
  location: string;

  @Field()
  timeSlot: Date;

  @Field(() => Float)
  totalPrice: number;

  @Field(() => PaymentType)
  paymentType: PaymentType;

  @Field(() => Int)
  estimatedTime: number;

  @Field({ nullable: true })
  transactionId?: string;
}
