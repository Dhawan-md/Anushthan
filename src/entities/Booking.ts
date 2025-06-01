import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { BookingStatus } from "../utils/enums";

@ObjectType()
@Entity()
export class Booking {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field({ nullable: true })
  @Column({ name: "user_id", nullable: true })
  userId: string;

  @Field({ nullable: true })
  @Column({ name: "pandit_id", nullable: true })
  panditId?: string;

  @Field(() => [String])
  @Column("text", { array: true, name: "service_ids" })
  serviceIds: string[];

  @Field()
  @Column()
  location: string;

  @Field(() => BookingStatus)
  @Column({ type: "enum", enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Field()
  @Column({ name: "scheduled_time" })
  scheduledTime: Date;

  @Field()
  @Column("float", { name: "total_price" })
  totalPrice: number;

  @Field()
  @Column({ name: "estimated_time" })
  estimatedTime: number;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
