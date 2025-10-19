import { InputType, Field, Float } from "type-graphql";

@InputType()
export class LocationInput {
  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;
}

