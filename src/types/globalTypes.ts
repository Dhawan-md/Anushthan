import { ObjectType, Field } from "type-graphql";

import { BookingStatus, PaymentType } from "../utils/enums";

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

@ObjectType()
export class RefreshToken {
  @Field()
  token: string;

  @Field()
  expiresIn: number;

  constructor(token: string, expiresIn: number) {
    this.token = token;
    this.expiresIn = expiresIn;
  }
}

@ObjectType()
export class OtpToken {
  @Field()
  otpCode: string;

  @Field()
  createdAt: Date;

  @Field()
  expiresAt: Date;

  constructor(otpCode: string, createdAt: Date, expiresAt: Date) {
    this.otpCode = otpCode;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
  }
}

export type BookingFilters = {
  userId?: string;
  panditId?: string;
  categoryId?: string;
  location?: string;
  status?: BookingStatus;
  paid?: boolean;
  paymentType?: PaymentType;
  timeSlot?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
};
