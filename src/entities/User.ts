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
  @Column()
  username!: string;

  @Field()
  @Column({ unique: true })
  @Index()
  userEmail!: string;

  @Field()
  @Column({ unique: true, name: "phone_number" })
  phoneNumber!: string;

  @Field()
  @Column()
  password!: string;

  @Field()
  @Column({
    name: "user_role",
    type: "enum",
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  userRole!: UserRole;

  @Field({ nullable: true })
  @Column({ name: "profileImage", nullable: true })
  profileImage?: string;

  @Field()
  @OneToOne(() => Pandit, (pandit) => pandit.user, { nullable: true })
  pandit?: Pandit;

  @Field()
  @OneToOne(() => Otp, (otp) => otp.user)
  otp!: Otp;

  @Field()
  @Column({ default: false, name: "is_verified" })
  isVerified!: boolean;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
