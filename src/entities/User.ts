import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  UpdateDateColumn,
  Index,
  OneToMany,
  JoinColumn,
} from "typeorm";

import { UserRole } from "../utils/enums";
import { Pandit } from "./Pandit";
import { Otp } from "./Otp";
import { UserLocation } from "./UserLocation";
import { Cart } from "./Cart";

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

  @Field({ nullable: true })
  @Column({ nullable: true })
  refreshToken?: string;

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

  @Field(() => Pandit, { nullable: true })
  @OneToOne(() => Pandit, (pandit) => pandit.user, { nullable: true })
  pandit?: Pandit;

  @Field()
  @OneToOne(() => Otp, (otp) => otp.user)
  otp!: Otp;

  @Field()
  @OneToOne(() => Cart, (cart) => cart.user)
  cart!: Cart;

  @Field(() => [UserLocation], { nullable: true })
  @OneToMany(() => UserLocation, (location) => location.user, {
    cascade: true,
    eager: true,
  })
  addresses?: UserLocation[];

  // But only one currently selected address
  @Field(() => UserLocation, { nullable: true })
  @OneToOne(() => UserLocation, { nullable: true })
  @JoinColumn({ name: "selected_address_id" })
  selectedAddress?: UserLocation;

  @Field({ nullable: true })
  @Column({ nullable: true })
  deviceToken?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  deviceType?: string; // 'android' | 'ios'

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
