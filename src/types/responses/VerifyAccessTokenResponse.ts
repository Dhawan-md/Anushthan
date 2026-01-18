import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class VerifyAccessTokenResponse {
  @Field()
  valid!: boolean;

  @Field()
  role!: string; // "USER" | "PANDIT"

  @Field()
  id!: string;
}
