import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { Service } from "./Service";

@ObjectType()
@Entity()
export class Category {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ unique: true })
  @Index()
  name!: string;

  @Field(() => [Service], { nullable: true })
  @OneToMany(() => Service, (service) => service.category, { eager: true })
  services?: Service[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
