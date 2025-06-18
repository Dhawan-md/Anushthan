import { InputType, Field } from "type-graphql";

import { UserCancellationReason } from "../../../utils/enums";

@InputType()
export class CancelBookingInput {
  @Field()
  bookingId: string;

  @Field({ nullable: true })
  confirmFee: boolean;

  @Field(() => UserCancellationReason)
  cancelReason: UserCancellationReason;

  @Field({ nullable: true })
  customReason?: string;
}
