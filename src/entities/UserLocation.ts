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
  RelationId,
} from "typeorm";
import { ObjectType, Field, Float } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
@Unique(["user"])
export class UserLocation {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.userLocation)
  @JoinColumn({ name: "user_Id" }) // this links to User.id
  user: User;

  @RelationId((location: UserLocation) => location.user)
  userId: string;

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
