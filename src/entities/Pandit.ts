import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";

import { User } from "./User";
import { Field, ObjectType } from "type-graphql";
import { Service } from "./Service";

@ObjectType()
@Entity()
export class Pandit {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.pandit, { onDelete: "CASCADE" })
  @JoinColumn()
  user!: User;

  @Field(() => [Service], { nullable: true })
  @ManyToMany(() => Service, (service) => service.pandits)
  @JoinTable()
  services: Service[];

  @Field()
  @Column({ type: "int", default: 0 })
  experience!: number;

  @Field()
  @Column()
  password!: string;

  @Field()
  @Column({ type: "double precision", nullable: true })
  latitude?: number;

  @Field()
  @Column({ type: "double precision", nullable: true })
  longitude?: number;

  @Field()
  @Column()
  address!: string;

  @Field()
  @Column({ default: false, name: "is_available" })
  isAvailable!: boolean;

  @Field({ nullable: true })
  @Column({ name: "documents", nullable: true })
  documents?: string;

  @Field()
  @Column({ type: "boolean", default: false, name: "is_verified" })
  isVerified!: boolean;

  @Field()
  @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
  ratings!: number;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
