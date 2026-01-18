import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Field, Float, ObjectType } from "type-graphql";
import { PanditLedgerStatus, PanditLedgerType } from "../utils/enums";

@ObjectType()
@Entity()
@Index("idx_pandit_ledger_pandit_created", ["panditId", "createdAt"])
export class PanditLedger {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ name: "pandit_id" })
  @Index()
  panditId!: string;

  @Field({ nullable: true })
  @Column({ name: "booking_id", nullable: true })
  bookingId?: string;

  @Field({ nullable: true })
  @Column({ name: "transaction_id", nullable: true })
  transactionId?: string; // link to your Transaction if relevant

  @Field(() => PanditLedgerType)
  @Column({ type: "enum", enum: PanditLedgerType })
  type!: PanditLedgerType;

  /**
   * Signed amount:
   *  + => increases pandit's balance (earning)
   *  - => decreases pandit's balance (penalty, payout)
   */
  @Field(() => Float)
  @Column("float")
  amount!: number;

  @Field(() => PanditLedgerStatus)
  @Column({
    type: "enum",
    enum: PanditLedgerStatus,
    default: PanditLedgerStatus.POSTED,
  })
  status!: PanditLedgerStatus;

  @Field({ nullable: true })
  @Column({ type: "text", nullable: true })
  note?: string;

  // Idempotency key prevents duplicates (VERY important)
  @Field()
  @Column({ name: "reference_key", unique: true })
  referenceKey!: string;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
