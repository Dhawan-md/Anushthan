import { Field, Float, ObjectType } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserCancellationReason, UserRole } from "../utils/enums";

@ObjectType()
@Entity()
export class CancelledBooking {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ name: "user_id" })
  userId!: string;

  @Field({ nullable: true })
  @Column({ name: "pandit_id", nullable: true })
  panditId?: string;

  @Field()
  @Column({ name: "booking_id" })
  bookingId!: string;

  @Field(() => Float)
  @Column("float", { name: "penalty_amount" })
  penaltyAmount!: number;

  @Field(() => Float)
  @Column("float", { name: "refund_amount" })
  refundAmount!: number;

  @Field(() => UserRole)
  @Column({
    type: "enum",
    enum: UserRole,
    name: "cancelled_by",
  })
  cancelledBy!: UserRole;

  @Field(() => UserCancellationReason)
  @Column({ type: "enum", enum: UserCancellationReason, name: "cancel_reason" })
  cancelReason!: UserCancellationReason;

  @Field({ nullable: true })
  @Column({ type: "text", nullable: true, name: "custom_reason" })
  customReason?: string;

  @Field()
  @Column({ default: false, name: "is_penalty_applied" })
  isPenaltyApplied: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: "cancelled_at" })
  cancelledAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt!: Date;
}
