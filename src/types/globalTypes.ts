import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class AccessToken {
  @Field()
  token: string;

  @Field()
  expiresIn: number;

  constructor(token: string, expiresIn: number) {
    this.token = token;
    this.expiresIn = expiresIn;
  }
}