import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  Index,
} from "typeorm";
import { Field, Float, Int, ObjectType } from "type-graphql";

import { Transaction } from "./Transaction";
import { CancelledBooking } from "./CancelledBooking";

import { BookingStatus, PaymentType } from "../utils/enums";

// @Index("idx_user_timeslot_status", ["userId", "timeSlot", "status"])
@ObjectType()
@Entity()
export class Booking {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ name: "user_id" })
  @Index()
  userId!: string;

  @Field({ nullable: true })
  @Column({ name: "pandit_id", nullable: true })
  @Index()
  panditId?: string;

  @Field(() => [String])
  @Column("text", { array: true, name: "service_ids" })
  serviceIds!: string[];

  @Field()
  @Column({ name: "category_id" })
  categoryId!: string;

  @Field()
  @Column()
  location!: string;

  @Field(() => BookingStatus)
  @Column({
    type: "enum",
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status!: BookingStatus;

  @Field()
  @Column({ name: "time_id" })
  timeSlotId!: string;

  @Field()
  @Column({ name: "booking_date", type: "date" })
  bookingDate!: Date;

  @Field(() => Float, { defaultValue: 10, name: "radius_km" })
  radiusKm: number = 10;

  @Field(() => Float)
  @Column("float", { name: "total_price" })
  totalPrice!: number;

  @Field(() => Float, { nullable: true })
  @Column("float", { name: "sub_total_price", nullable: true })
  subTotalPrice?: number;

  @Field(() => Float, { nullable: true })
  @Column("float", { name: "gst_tax", nullable: true })
  gstTax?: number;

  @Field(() => Float, { nullable: true })
  @Column("float", { nullable: true })
  discount?: number;

  @Field(() => Float, { nullable: true })
  @Column("float", { name: "platform_fee", nullable: true })
  platformFee?: number;

  @Field(() => Int)
  @Column({ name: "estimated_time" })
  estimatedTime!: number;

  @Field()
  @Column({ default: false })
  paid!: boolean;

  @Field(() => PaymentType)
  @Column({
    name: "paymentType",
    type: "enum",
    enum: PaymentType,
  })
  paymentType!: PaymentType; // Consider using enum

  @OneToOne(() => Transaction, (transaction) => transaction.booking)
  transaction!: Transaction;

  @Field({ nullable: true })
  @Column({ nullable: true, type: "timestamp", name: "cancelled_at" })
  cancelledAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true, type: "timestamp", name: "started_at" })
  startedAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true, type: "timestamp", name: "completed_at" })
  completedAt?: Date;

  @Field({ nullable: true })
  @Column("float", { nullable: true })
  rating?: number;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  review?: string;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToOne(() => CancelledBooking, (cb) => cb.booking)
  cancelled_booking: CancelledBooking;
}
