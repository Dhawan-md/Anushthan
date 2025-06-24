import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Field, Float, Int, ObjectType } from "type-graphql";
import { BookingStatus, PaymentType } from "../utils/enums";
import { Transaction } from "./Transaction";

@ObjectType()
@Entity()
export class Booking {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ name: "user_id" })
  userId!: string;

  @Field({ nullable: true })
  @Column({ name: "pandit_id", nullable: true })
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
  @Column({ name: "time_slot", type: "timestamp" })
  timeSlot!: Date;

  @Field(() => Float)
  @Column("float", { name: "total_price" })
  totalPrice!: number;

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

  @OneToMany(() => Transaction, (transaction) => transaction.booking)
  transactions!: Transaction[];

  @Field({ nullable: true })
  @Column({ nullable: true, type: "timestamp" })
  cancelledAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true, type: "timestamp" })
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

  @Field({ nullable: true })
  @Column({ name: "cancellation_id", nullable: true })
  cancellationId?: string;
}
