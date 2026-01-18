import { Arg, Authorized, Ctx, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";
import { plainToInstance } from "class-transformer";

import { UserLocationProvider } from "../../providers/user/UserLocationProvider";

import { NearByPanditResponse } from "../../types/responses/PanditResponse";

import { Context } from "../../types/context";
import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";
import { NearByPanditInput } from "../../types/inputTypes/pandit/NearByPanditInput";
import { NearByPanditFiltersDto } from "../../types/dtos/Pandit";
import { UserRole } from "../../utils/enums";
import { LocationSuggestion } from "../../types/interfaces";
import { LocationSuggestionResponse } from "../../types/responses/LocationResponse";
import { MultipleUserLocationResponse } from "../../types/responses/UserLocationResponse";
import { verifyAccessToken } from "../../helpers/verifyJwtToken";
import { SingleUserResponse } from "../../types/responses/UserResponse";
import { UserInfoProvider } from "../../providers/user/UserInfoProvider";
import { VerifyAccessTokenResponse } from "../../types/responses/VerifyAccessTokenResponse";

@Service()
@Resolver()
export class UserQueryResolver {
  constructor(
    @Inject(() => UserLocationProvider)
    private userLocationProvider: UserLocationProvider,
    @Inject(() => UserInfoProvider)
    private userInfoProvider: UserInfoProvider
  ) {}

  @Query(() => SingleUserResponse)
  async fetchUserDetails(@Ctx() ctx: Context): Promise<SingleUserResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId || !userRole) throw new CustomError(UNAUTHORIZED);

    return this.userInfoProvider.fetchUserDetails(userId);
  }

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

  @Query(() => [LocationSuggestionResponse])
  @Authorized(UserRole.USER)
  async searchLocationSuggestions(
    @Arg("query") query: string
  ): Promise<LocationSuggestion[]> {
    const suggestions = await this.userLocationProvider.searchLocations(query);
    return suggestions;
  }

  @Query(() => MultipleUserLocationResponse)
  @Authorized(UserRole.USER)
  async getAllAddressesForUser(
    @Ctx() ctx: Context
  ): Promise<MultipleUserLocationResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId || !userRole) throw new CustomError("Unauthenticated");
    const suggestions =
      await this.userLocationProvider.getAllAddressesForUser(userId);
    return suggestions;
  }

  @Query(() => VerifyAccessTokenResponse)
  async verifyAccessToken(
    @Ctx() ctx: Context
  ): Promise<VerifyAccessTokenResponse> {
    const authHeader = ctx.req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return {
        valid: false,
        role: "",
        id: "",
      };
    }

    try {
      const payload = verifyAccessToken(token);

      return {
        valid: true,
        role: payload.userRole, // USER | PANDIT
        id: payload.id,
      };
    } catch (err) {
      return {
        valid: false,
        role: "",
        id: "",
      };
    }
  }
}
