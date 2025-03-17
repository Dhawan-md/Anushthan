import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryGeneratedColumn("uuid", { name: "user_id" })
  id!: number;

  @Field()
  @Column()
  name!: string;

  @Field()
  @Column()
  username!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Field()
  @Column({ unique: true, name:"phone_number" })
  phoneNumber: string

  @Field()
  @Column()
  password!: string;

  @Field()
  @Column({ default: false, name: "is_verified" })
  isVerified!: boolean;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
