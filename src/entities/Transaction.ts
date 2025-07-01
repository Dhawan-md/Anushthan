import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { ObjectType } from "type-graphql";
import { TransactionStatus, TransactionType, UserRole } from "../utils/enums";
import { Booking } from "./Booking";
import { Refund } from "./Refund";

@ObjectType()
@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column({ type: "enum", enum: UserRole })
  userRole!: UserRole;

  @Column({ name: "booking_id" })
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

  @OneToMany(() => Refund, (refund) => refund.transaction, { cascade: true })
  refunds!: Refund[];

  @Column({ nullable: true })
  paymentMethod?: string;

  @Column({ nullable: true })
  orderId?: string;

  @Column({ nullable: true })
  paymentReferenceId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
