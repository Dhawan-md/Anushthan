import { Field, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ActiveStatus, OtpType } from "../utils/enums";

import { User } from "./User";

@ObjectType()
@Entity()
export class Otp {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => User, { nullable: true })
  @OneToOne(() => User, (user) => user.otp, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Field()
  @Column({ name: "phone_number", unique: true })
  @Index()
  phoneNumber!: string;

  @Field()
  @Column({ name: "otp_code" })
  otpCode!: string;

  @Field()
  @Column({ name: "user_secret" })
  userSecret!: string;

  @Field(() => ActiveStatus)
  @Column({
    name: "status",
    type: "enum",
    enum: ActiveStatus,
    enumName: "status",
    default: ActiveStatus.ACTIVE,
  })
  status!: ActiveStatus;

  @Field(() => OtpType)
  @Column({
    name: "otp_type",
    type: "enum",
    enum: OtpType,
    enumName: "otp_type",
    default: OtpType.USER,
  })
  otpType!: OtpType;

  @Field({ nullable: true })
  @Column({ name: "session_info", nullable: true })
  sessionInfo?: string;

  @Field()
  @Column({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @Column({ name: "expires_at" })
  expiresAt!: Date;
}
