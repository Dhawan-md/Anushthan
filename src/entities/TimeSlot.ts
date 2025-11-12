import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class TimeSlot {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field()
  @Column()
  label!: string; // e.g. "9:00 - 12:00"

  @Field()
  @Column({ name: "start_time", type: "time" })
  startTime!: string;

  @Field()
  @Column({ name: "end_time", type: "time" })
  endTime!: string;
}