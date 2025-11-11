import { Field, Int, ObjectType } from "type-graphql";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

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
  @Column({ type: "text" })
  description: string | null;

  @Field(() => Int)
  @Column({ type: "int" })
  price!: number;

  @Field(() => Int)
  @Column({ type: "int", default: 30 })
  duration!: number;

  @Field(() => String)
  @Column({ type: "text", name: "image_path", nullable: true })
  imagePath!: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field(() => Category)
  @ManyToOne(() => Category, (category) => category.services)
  @JoinColumn({ name: "category_id" }) // Optional: customize DB column name
  @Index()
  category!: Category;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
