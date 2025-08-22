import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { UserLocationProvider } from "../../providers/user/UserLocationProvider";

import { NearByPanditResponse } from "../../types/responses/PanditResponse";

import { Context } from "../../types/context";
import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";
import { NearByPanditInput } from "../../types/inputTypes/pandit/NearByPanditInput";
import { plainToInstance } from "class-transformer";
import { NearByPanditFiltersDto } from "../../types/dtos/Pandit";

@Service()
@Resolver()
export class UserQueryResolver {
  constructor(
    @Inject(() => UserLocationProvider)
    private userLocationProvider: UserLocationProvider
  ) {}

  @Query(() => NearByPanditResponse)
  async findNearbyPandits(
    @Ctx() ctx: Context,
    @Arg("filters", { nullable: true }) filters?: NearByPanditInput
  ): Promise<NearByPanditResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId || !userRole) throw new CustomError(UNAUTHORIZED);

    const dto: NearByPanditFiltersDto = plainToInstance(
      NearByPanditFiltersDto,
      { userId, ...filters }
    );

    return this.userLocationProvider.findNearbyPandits(dto);
  }
}
