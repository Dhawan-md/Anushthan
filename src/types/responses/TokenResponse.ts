import { Field, ObjectType } from "type-graphql";
import { AccessToken, RefreshToken } from "../globalTypes";

@ObjectType()
export class TokenResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => AccessToken)
  accessToken!: AccessToken;

  @Field(() => RefreshToken)
  refreshToken!: RefreshToken;
}
