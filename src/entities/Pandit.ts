import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./User";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Pandit {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.pandit, { onDelete: "CASCADE" })
  @JoinColumn()
  user!: User;

  @Field()
  @Column()
  category!: string;

  @Field()
  @Column({ type: "int", default: 0 })
  experience!: number;

  @Field()
  @Column({ type: "decimal", precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Field()
  @Column({ type: "decimal", precision: 10, scale: 8, nullable: true })
  longitude: number;

  @Field()
  @Column()
  address!: string;

  @Field()
  @Column({ default: false, name: "is_available" })
  isAvailable!: boolean;

  @Field()
  @Column({ type: "boolean", default: false, name: "documents_verified" })
  documentsVerified!: boolean;

  @Field()
  @Column({ type: "decimal", precision: 2, default: 0 })
  ratings!: number;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
