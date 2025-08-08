import { Ctx, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { Context } from "../../types/context";
import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";
import { UserLocationProvider } from "../../providers/user/UserLocationProvider";
import { NearByPanditResponse } from "../../types/responses/PanditResponse";

@Service()
@Resolver()
export class UserQueryResolver {
  constructor(
    @Inject(() => UserLocationProvider)
    private userLocationProvider: UserLocationProvider
  ) {}

  @Query(() => NearByPanditResponse)
  async findNearbyPandits(@Ctx() ctx: Context): Promise<NearByPanditResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId || !userRole) throw new CustomError(UNAUTHORIZED);

    return this.userLocationProvider.findNearbyPandits(userId);
  }
}
