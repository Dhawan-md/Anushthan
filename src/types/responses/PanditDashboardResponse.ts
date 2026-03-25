import { ObjectType, Field, Float, Int } from "type-graphql";
import { BaseResponse } from "../../utils/response";

@ObjectType()
export class PanditDashboardStats {
  @Field(() => Float)
  totalEarnings: number;

  @Field(() => Int)
  totalBookings: number;

  @Field(() => Int)
  completedBookings: number;

  @Field(() => Int)
  pendingBookings: number;
}

@ObjectType()
export class PanditDashboardResponse extends BaseResponse<PanditDashboardStats> {
  @Field(() => PanditDashboardStats, { nullable: true })
  declare data?: PanditDashboardStats | null;

  constructor(success: boolean, message: string, data?: PanditDashboardStats | null) {
    super(success, message, data);
  }
}
