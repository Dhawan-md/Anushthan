import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from "typeorm";

import { Service } from "./Service";
import { Pandit } from "./Pandit";

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

  @ManyToMany(() => Pandit, (pandit) => pandit.categories)
  pandits!: Pandit[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
