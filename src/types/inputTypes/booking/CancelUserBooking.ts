import { InputType, Field } from "type-graphql";

@InputType()
export class CancelUserBookingInput {
  @Field()
  bookingId: string;

  @Field({ nullable: true })
  confirmFee: boolean;
}