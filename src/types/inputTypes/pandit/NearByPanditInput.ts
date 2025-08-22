import { InputType, Field, Float } from "type-graphql";

@InputType()
export class NearByPanditInput {
  @Field()
  timeSlotId: string;

  @Field(() => Date)
  bookingDate: Date;

  @Field(() => Float, { defaultValue: 10 })
  radiusKm: number = 10;

  @Field({ nullable: true })
  categoryId?: string;
}
