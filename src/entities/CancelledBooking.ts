import { Field, Float, ObjectType } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { ActiveStatus, UserCancellationReason, UserRole } from "../utils/enums";
import { Booking } from "./Booking";

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
  @Column("float")
  amount!: number;

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
  isPenaltyApplied!: boolean;

  @Field(() => ActiveStatus)
  @Column({ type: "enum", enum: ActiveStatus, default: ActiveStatus.ACTIVE })
  status!: ActiveStatus;

  @Field(() => Date)
  @CreateDateColumn({ name: "cancelled_at" })
  cancelledAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => Booking, (booking) => booking.cancelled_booking)
  @JoinColumn()
  booking: Booking;
}
