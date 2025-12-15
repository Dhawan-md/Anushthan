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

  @Field(() => Float)
  subTotalPrice: number;

  @Field(() => Float, { defaultValue: 0 })
  gstTax: number;

  @Field(() => Float, { defaultValue: 0 })
  platformFee?: number;

  @Field(() => Float, { defaultValue: 0 })
  discount: number;

  @Field(() => PaymentType)
  paymentType: PaymentType;

  @Field(() => Int)
  estimatedTime: number;

  @Field({ nullable: true })
  transactionId?: string;

  @Field()
  timeSlotId: string;

  @Field(() => Date)
  bookingDate: Date;

  @Field(() => Float, { defaultValue: 10 })
  radiusKm: number = 10;
}
