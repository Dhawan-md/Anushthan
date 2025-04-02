import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
} from "typeorm";

import { AdminRole } from "../utils/enums";

@ObjectType()
@Entity()
export class Admin extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid", { name: "admin_id" })
  id!: string;

  @Field()
  @Column({ name: "full_name" })
  fullName!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Field()
  @Column()
  password!: string;

  @Field()
  @Column({ name: "employ_id", type: "uuid" })
  @Generated("uuid")
  employId!: string;

  @Field()
  @Column({
    name: "admin_role",
    type: "enum",
    enum: AdminRole,
    default: AdminRole.ADMIN,
  })
  adminRole!: AdminRole;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
