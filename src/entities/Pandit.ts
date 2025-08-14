import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";

import { User } from "./User";
import { Field, ObjectType } from "type-graphql";
import { PanditStatus } from "../utils/enums";
import { Category } from "./Category";

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

  @Field(() => [Category])
  @ManyToMany(() => Category, (category) => category.pandits)
  @JoinTable()
  categories: Category[];

  @Field()
  @Column({ type: "int", default: 0 })
  experience!: number;

  @Field()
  @Column()
  password!: string;

  @Field()
  @Column({ default: false, name: "is_available" })
  isAvailable!: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: "text", name: "documents", nullable: true })
  documents: string | null;

  @Field(() => PanditStatus)
  @Column({ type: "enum", default: PanditStatus.PENDING, enum: PanditStatus })
  status!: PanditStatus;

  @Field()
  @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
  ratings!: number;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
