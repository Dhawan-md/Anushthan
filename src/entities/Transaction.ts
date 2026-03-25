import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
  OneToOne,
  Index,
  UpdateDateColumn,
} from "typeorm";
import { ObjectType, Field, Float } from "type-graphql";

import { Booking } from "./Booking";
import { Refund } from "./Refund";

import { TransactionStatus, TransactionType, UserRole } from "../utils/enums";

@ObjectType()
@Entity()
export class Transaction {
  @Field(() => String)
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => String)
  @Column({ name: "user_id" })
  @Index()
  userId!: string;

  @Field(() => UserRole)
  @Column({ type: "enum", enum: UserRole })
  userRole!: UserRole;

  @Field(() => String)
  @Column({ name: "booking_id" })
  @Index()
  bookingId!: string;

  @Field(() => Booking, { nullable: true })
  @OneToOne(() => Booking, (booking) => booking.transaction)
  @JoinColumn()
  booking!: Booking;

  @Field(() => Float)
  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Field(() => TransactionType)
  @Column({ type: "enum", enum: TransactionType })
  type!: TransactionType;

  @Field(() => TransactionStatus)
  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @Field(() => Boolean)
  @Column({ default: false, name: "is_refunded" })
  isRefunded!: boolean;

  @Field(() => [Refund], { nullable: true })
  @OneToMany(() => Refund, (refund) => refund.transaction)
  refunds!: Refund[];

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, name: "payment_method" })
  paymentMethod?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, name: "order_id" })
  orderId?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, name: "payment_reference_id" })
  @Index()
  paymentReferenceId?: string;

  @Field(() => Date)
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
