import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  JoinColumn,
  Unique,
} from "typeorm";
import { Field, ObjectType, ID } from "type-graphql";
import { User } from "./User";
import { Service } from "./Service";

@ObjectType()
@Entity()
@Unique(["user"]) // ✅ ensures one cart per user at DB level
export class Cart {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // 🧍 Each user has exactly one cart
  @Field(() => User, { nullable: true })
  @OneToOne(() => User, (user) => user.cart, {
    onDelete: "CASCADE",
    eager: true,
  })
  @JoinColumn()
  user!: User;

  // 🧩 Category ID – all services belong to this category
  @Field(() => String, { nullable: true })
  @Column("text", { name: "category_id", nullable: true })
  categoryId?: string | null;

  // 🛒 Services – selected services
  @Field(() => [Service])
  @ManyToMany(() => Service, { eager: true })
  @JoinTable({
    name: "cart_services",
    joinColumn: { name: "cart_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "service_id", referencedColumnName: "id" },
  })
  services!: Service[];

  // 💰 Total price of all services
  @Field()
  @Column({ type: "int", default: 0 })
  totalPrice!: number;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
