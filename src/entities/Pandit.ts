import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";

import { User } from "./User";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Pandit {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(()=>User)
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
  @Column()
  location!: string;

  @Field()
  @Column({ type: "boolean", default: false })
  documents_verified!: boolean;

  @Field()
  @Column({ type: "decimal", precision: 2, default: 0 })
  ratings!: number;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
