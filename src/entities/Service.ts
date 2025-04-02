import { Field, ObjectType } from "type-graphql";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Pandit } from "./Pandit";

@ObjectType()
@Entity()
export class Service {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ unique: true })
  name!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: "text", nullable: true })
  description?: string

  @Field()
  @Column({ type: "int"})
  price!: number;

  @Field()
  @Column({ type: "int", default: 30 })
  duration!: number;

  @Field(() => [Pandit], { nullable: true })
  @ManyToMany(() => Pandit, (pandit) => pandit.services)
  pandits!: Pandit[];

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
