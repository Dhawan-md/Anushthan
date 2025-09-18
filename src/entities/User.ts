import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  UpdateDateColumn,
  Index,
} from "typeorm";

import { UserRole } from "../utils/enums";
import { Pandit } from "./Pandit";
import { Otp } from "./Otp";
import { UserLocation } from "./UserLocation";

@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryGeneratedColumn("uuid", { name: "user_id" })
  id!: string;

  @Field()
  @Column()
  name!: string;

  @Field()
  @Column({ name: "user_email", unique: true })
  @Index()
  userEmail!: string;

  @Field()
  @Column({ unique: true, name: "phone_number" })
  @Index()
  phoneNumber!: string;

  @Field()
  @Column({
    name: "user_role",
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

  @Field(() => UserLocation, { nullable: true })
  @OneToOne(() => UserLocation, (location) => location.user, {
    cascade: true,
    eager: true,
  })
  userLocation?: UserLocation;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
