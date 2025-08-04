// entities/UserLocation.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { ObjectType, Field, Float } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
@Unique(["userId"])
export class UserLocation {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ name: "user_id" })
  userId: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.userLocation)
  @JoinColumn({ name: "userId" }) // this links to User.id
  user: User;

  @Field(() => Float)
  @Column("double precision")
  latitude: number;

  @Field(() => Float)
  @Column("double precision")
  longitude: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
