import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { ObjectType, Field, Float, Int } from "type-graphql";

import { Transaction } from "./Transaction";

import { RefundReason, RefundStatus, UserRole } from "../utils/enums";

@ObjectType()
@Entity()
export class Refund {
  @Field(() => String)
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => Float)
  @Column("decimal", { precision: 10, scale: 2, name: "original_amount" })
  originalAmount!: number;

  @Field(() => Float)
  @Column("decimal", { precision: 10, scale: 2, name: "refund_amount" })
  refundAmount!: number;

  @Field(() => String)
  @Column({ name: "user_id" })
  @Index()
  userId!: string;

  @Field(() => UserRole)
  @Column({ type: "enum", enum: UserRole })
  userRole!: UserRole;

  @Field(() => RefundStatus)
  @Column({ name: "status", enum: RefundStatus, default: RefundStatus.PENDING })
  status!: RefundStatus;

  @Field(() => String)
  @Column({ name: "booking_id" })
  @Index()
  bookingId!: string;

  @Field(() => String)
  @Column({ name: "transaction_id" })
  @Index()
  transactionId!: string;

  // Returning the parent transaction is optional. Omit from Field for now to avoid circular if not needed.
  @ManyToOne(() => Transaction, (transaction) => transaction.refunds)
  @JoinColumn()
  @Index()
  transaction!: Transaction;

  @Field(() => RefundReason)
  @Column({ type: "enum", enum: RefundReason, name: "refund_reason" })
  refundReason!: RefundReason;

  @Field(() => String, { nullable: true })
  @Column({ name: "failure_reason", nullable: true })
  failedReason?: string;

  @Field(() => Int)
  @Column({ name: "attempt_number" })
  attemptNumber!: number;

  @Field(() => String)
  @Column({ name: "payment_reference_id" })
  paymentReferenceId!: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, name: "refund_reference_id" })
  refundReferenceId?: string;

  @Field(() => Date, { nullable: true })
  @Column({ name: "refunded_at", nullable: true })
  refundedAt?: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
