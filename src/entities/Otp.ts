import { Field, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { OtpStatus, OtpType } from "../utils/enums";
import { User } from "./User";

@ObjectType()
@Entity()
export class Otp {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.otp, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Field()
  @Column({ name: "user_email" })
  @Index()
  userEmail!: string;

  @Field()
  @Column({ name: "otp_code" })
  otpCode!: string;

  @Field()
  @Column({ name: "user_secret" })
  userSecret!: string;

  @Field(() => OtpStatus)
  @Column({
    name: "status",
    type: "enum",
    enum: OtpStatus,
    enumName: "status",
    default: OtpStatus.ACTIVE,
  })
  status!: OtpStatus;

  @Field(() => OtpType)
  @Column({
    name: "otp_type",
    type: "enum",
    enum: OtpType,
    enumName: "otp_type",
    default: OtpType.USER,
  })
  otpType!: OtpType;

  @Field()
  @Column({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @Column({ name: "expires_at" })
  expiresAt!: Date;
}
