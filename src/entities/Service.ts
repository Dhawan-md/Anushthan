import { Field, Int, ObjectType } from "type-graphql";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Pandit } from "./Pandit";
import { Category } from "./Category";

@ObjectType()
@Entity()
export class Service {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ unique: true })
  name!: string;

  @Field(() => String)
  @Column({ type: "text", nullable: true })
  description: string | null;

  @Field(() => Int)
  @Column({ type: "int" })
  price!: number;

  @Field(() => Int)
  @Column({ type: "int", default: 30 })
  duration!: number;

  @Field(() => [Pandit], { nullable: true })
  @ManyToMany(() => Pandit, (pandit) => pandit.services)
  pandits!: Pandit[];

  @Field(() => Category)
  @ManyToOne(() => Category, (category) => category.services)
  @JoinColumn({ name: "category_id" }) // Optional: customize DB column name
  category!: Category;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
