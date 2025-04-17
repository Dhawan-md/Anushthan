import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  UpdateDateColumn,
  Index,
  BaseEntity,
} from "typeorm";

import { UserRole } from "../utils/enums";
import { Pandit } from "./Pandit";
import { Otp } from "./Otp";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid", { name: "user_id" })
  id!: string;

  @Field()
  @Column()
  name!: string;

  @Field()
  @Column({name:"user_email", unique: true })
  @Index()
  userEmail!: string;

  @Field()
  @Column({ unique: true, name: "phone_number" })
  phoneNumber!: string;

  @Field()
  @Column({
    name:"user_role",
    type: "enum",
    enum: UserRole,
    enumName: "user_role",
    default: UserRole.USER,
  })
  userRole!: UserRole;

  @Field({ nullable: true })
  @Column({ name: "profile_image", nullable: true })
  profileImage?: string;

  @Field()
  @OneToOne(() => Pandit, (pandit) => pandit.user, { nullable: true })
  pandit?: Pandit;

  @Field()
  @OneToOne(() => Otp, (otp) => otp.user)
  otp!: Otp;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
