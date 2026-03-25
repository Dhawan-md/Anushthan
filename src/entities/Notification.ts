import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Notification {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ name: "user_id" })
  @Index()
  userId!: string;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column("text")
  message!: string;

  @Field()
  @Column({ default: false, name: "is_read" })
  isRead!: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  type?: string;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
