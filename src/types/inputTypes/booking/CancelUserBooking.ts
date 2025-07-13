import { InputType, Field } from "type-graphql";

import {
  PanditCancellationReason,
  UserCancellationReason,
} from "../../../utils/enums";

export class CancelBookingInput {
  @Field()
  bookingId: string;

  @Field({ nullable: true })
  confirmFee: boolean;

  @Field({ nullable: true })
  customReason?: string;
}

@InputType()
export class CancelUserBookingInput extends CancelBookingInput {
  @Field(() => UserCancellationReason)
  cancelReason: UserCancellationReason;
}

@InputType()
export class CancelPanditBookingInput extends CancelBookingInput {
  @Field(() => PanditCancellationReason)
  cancelReason: PanditCancellationReason;
}
