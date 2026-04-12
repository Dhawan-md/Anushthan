import { Arg, Authorized, Ctx, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";
import { plainToInstance } from "class-transformer";

import { UserLocationService } from "../../services/user/UserLocationService";
import { UserInfoService } from "../../services/user/UserInfoService";

import { NearByPanditResponse } from "../../types/responses/PanditResponse";
import { SingleUserResponse } from "../../types/responses/UserResponse";

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

@Service()
@Resolver()
export class UserQueryResolver {
  constructor(
    @Inject(() => UserLocationService)
    private userLocationService: UserLocationService,
    @Inject(() => UserInfoService)
    private userInfoService: UserInfoService
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

    return this.userLocationService.findNearbyPandits(dto);
  }

  @Query(() => [LocationSuggestionResponse])
  @Authorized(UserRole.USER)
  async searchLocationSuggestions(
    @Arg("query") query: string
  ): Promise<LocationSuggestion[]> {
    const suggestions = await this.userLocationService.searchLocations(query);
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
      await this.userLocationService.getAllAddressesForUser(userId);
    return suggestions;
  }

  @Query(() => Boolean)
  async verifyAccessToken(@Ctx() ctx: Context): Promise<boolean> {
    const token = ctx.req.headers["authorization"]?.split(" ")[1];
    if (!token) return false;

    try {
      verifyAccessToken(token);
      return true;
    } catch (err) {
      return false; // invalid or expired
    }
  }

  @Query(() => SingleUserResponse)
  @Authorized()
  async fetchUserDetails(@Ctx() ctx: Context): Promise<SingleUserResponse> {
    const userId = ctx.user?.id;
    if (!userId) throw new CustomError(UNAUTHORIZED);

    const user = await this.userInfoService.getUser({ id: userId });
    return new SingleUserResponse(
      true,
      "User details fetched successfully",
      user
    );
  }
}
