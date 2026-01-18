import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Field, Float, ObjectType } from "type-graphql";
import { Pandit } from "./Pandit";

@ObjectType()
@Entity()
export class PanditWallet {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ name: "pandit_id", unique: true })
  @Index()
  panditId!: string;

  // lifetime totals (do not decrease, for analytics)
  @Field(() => Float)
  @Column("float", { name: "total_earnings", default: 0 })
  totalEarnings!: number;

  @Field(() => Float)
  @Column("float", { name: "total_penalties", default: 0 })
  totalPenalties!: number;

  // net pending balance (can be + or -)
  @Field(() => Float)
  @Column("float", { name: "net_pending", default: 0 })
  netPending!: number;

  @Field(() => Pandit)
  @OneToOne(() => Pandit, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pandit_id" }) // uses your existing pandit_id column
  pandit!: Pandit;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // GraphQL computed helpers (not stored)
  @Field(() => Float)
  get pendingToPandit(): number {
    return this.netPending > 0 ? this.netPending : 0;
  }

  @Field(() => Float)
  get pendingFromPandit(): number {
    return this.netPending < 0 ? Math.abs(this.netPending) : 0;
  }
}
