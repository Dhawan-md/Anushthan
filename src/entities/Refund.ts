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
import { ObjectType } from "type-graphql";

import { Transaction } from "./Transaction";

import { RefundReason, RefundStatus, UserRole } from "../utils/enums";

@ObjectType()
@Entity()
export class Refund {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("decimal", { precision: 10, scale: 2, name: "original_amount" })
  originalAmount!: number;

  @Column("decimal", { precision: 10, scale: 2, name: "refund_amount" })
  refundAmount!: number;

  @Column({ name: "user_id" })
  @Index()
  userId!: string;

  @Column({ type: "enum", enum: UserRole })
  userRole!: UserRole;

  @Column({ name: "status", enum: RefundStatus, default: RefundStatus.PENDING })
  status!: RefundStatus;

  @Column({ name: "booking_id" })
  @Index()
  bookingId!: string;

  @Column({ name: "transaction_id" })
  @Index()
  transactionId!: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.refunds)
  @JoinColumn()
  @Index()
  transaction!: Transaction;

  @Column({ type: "enum", enum: RefundReason, name: "refund_reason" })
  refundReason!: RefundReason;

  @Column({ name: "failure_reason", nullable: true })
  failedReason?: string;

  @Column({ name: "attempt_number" })
  attemptNumber!: number;

  @Column({ name: "payment_reference_id" })
  paymentReferenceId!: string;

  @Column({ nullable: true, name: "refund_reference_id" })
  refundReferenceId?: string;

  @Index("uq_refund_reference_key", ["referenceKey"], { unique: true })
  @Column({ name: "reference_key", type: "text", unique: true })
  referenceKey!: string;

  @Column({ name: "refunded_at", nullable: true })
  refundedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
