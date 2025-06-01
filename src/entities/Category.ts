import { Field, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Service } from "./Service";

@ObjectType()
@Entity()
export class Category {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column({ unique: true })
  name!: string;

  @Field(() => [Service], { nullable: true })
  @OneToMany(() => Service, (service) => service.category, { nullable: true })
  services?: Service[];
}
