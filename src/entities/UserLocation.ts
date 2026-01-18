// entities/UserLocation.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  RelationId,
  JoinColumn,
} from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class UserLocation {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @RelationId((location: UserLocation) => location.user)
  userId: string;

  @Field()
  @Column("decimal", { precision: 10, scale: 7 })
  latitude!: number;

  @Field()
  @Column("decimal", { precision: 10, scale: 7 })
  longitude!: number;

  @Field()
  @Column()
  label!: string;

  @Field()
  @Column({ name: "phone_number" })
  phoneNumber!: string;

  @Field()
  @Column({ nullable: true })
  addressDetails?: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.addresses, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @Field()
  @Column({ default: false, name: "is_deleted" })
  isDeleted!: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, name: "deleted_at" })
  deletedAt?: Date;
}
