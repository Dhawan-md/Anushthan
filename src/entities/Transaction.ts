import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { TransactionStatus, TransactionType, UserRole } from "../utils/enums";
import { Booking } from "./Booking";

@ObjectType()
@Entity()
export class Transaction {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column()
  userId!: string;

  @Field(() => UserRole)
  @Column({ type: "enum", enum: UserRole })
  userRole!: UserRole;

  @Field()
  @Column()
  bookingId!: string;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: "bookingId" })
  booking?: Booking;

  @Field()
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

  @Column({ nullable: true })
  @Field({ nullable: true })
  paymentProvider?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  orderId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  paymentReferenceId?: string;

  @Column({ default: false })
  @Field()
  isTest!: boolean;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;
}
