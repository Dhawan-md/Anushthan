import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ObjectType } from "type-graphql";
import { RefundReason, RefundStatus, UserRole } from "../utils/enums";
import { Transaction } from "./Transaction";

@ObjectType()
@Entity()
export class Refund {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("decimal", { precision: 10, scale: 2, name: "original_amount" })
  originalAmount!: number;

  @Column("decimal", { precision: 10, scale: 2, name: "refund_amount" })
  refundAmount!: number;

  @Column()
  userId!: string;

  @Column({ type: "enum", enum: UserRole })
  userRole!: UserRole;

  @Column({ name: "status", enum: RefundStatus, default: RefundStatus.PENDING })
  status!: RefundStatus;

  @Column()
  bookingId!: string;

  @Column({ name: "transaction_id" })
  transactionId!: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.refunds)
  @JoinColumn()
  transaction!: Transaction;

  @Column({ type: "enum", enum: RefundReason, name: "refund_reason" })
  refundReason!: RefundReason;

  @Column({ name: "payment_reference_id" })
  paymentReferenceId: string;

  @Column({ nullable: true, name: "refund_reference_id" })
  refundReferenceId?: string;

  @Column({ name: "refunded_at", nullable: true })
  refundedAt?: Date;
}
