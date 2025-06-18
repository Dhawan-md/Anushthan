import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { RefundReason, UserRole } from "../utils/enums";
import { Transaction } from "./Transaction";

@ObjectType()
@Entity()
export class Refund {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column("decimal", { precision: 10, scale: 2, name: "original_amount" })
  originalAmount!: number;

  @Field()
  @Column("decimal", { precision: 10, scale: 2, name: "refund_amount" })
  refundAmount!: number;

  @Field()
  @Column()
  userId!: string;

  @Field(() => UserRole)
  @Column({ type: "enum", enum: UserRole })
  userRole!: UserRole;

  @Field()
  @Column()
  bookingId!: string;

  @Column({ unique: true })
  transactionId!: string;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transactionId" })
  transaction!: Transaction;

  @Field({ nullable: true })
  @Column({ nullable: true })
  paymentReferenceId?: string;

  @Field(() => RefundReason, { nullable: false })
  @Column({ type: "enum", enum: RefundReason, nullable: true })
  refundReason?: RefundReason;

  @Field()
  @CreateDateColumn({ name: "refunded_at" })
  refundedAt!: Date;
}
