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
import { ObjectType } from "type-graphql";

import { Booking } from "./Booking";
import { Refund } from "./Refund";

import { TransactionStatus, TransactionType, UserRole } from "../utils/enums";

@ObjectType()
@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id" })
  @Index()
  userId!: string;

  @Column({ type: "enum", enum: UserRole })
  userRole!: UserRole;

  @Column({ name: "booking_id" })
  @Index()
  bookingId!: string;

  @OneToOne(() => Booking, (booking) => booking.transaction)
  @JoinColumn()
  booking!: Booking;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: "enum", enum: TransactionType })
  type!: TransactionType;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @Column({ default: false, name: "is_refunded" })
  isRefunded!: boolean;

  @OneToMany(() => Refund, (refund) => refund.transaction)
  refunds!: Refund[];

  @Column({ nullable: true, name: "payment_method" })
  paymentMethod?: string;

  @Column({ nullable: true, name: "order_id" })
  orderId?: string;

  @Column({ nullable: true, name: "payment_reference_id" })
  @Index()
  paymentReferenceId?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
