import { InputType, Field } from "type-graphql";
import { TimeScalar } from "../../../scalar/TimeScalar";

@InputType()
export class CreateTimeSlotInput {
  @Field()
  label: string;

  @Field(() => TimeScalar)
  startTime: string;

  @Field(() => TimeScalar)
  endTime: string;
}
