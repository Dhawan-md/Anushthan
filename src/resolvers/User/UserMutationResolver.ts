import { plainToInstance } from "class-transformer";
import { Resolver, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { Inject, Service } from "typedi";

import { UserAuthService } from "../../services/user/UserAuthService";
import { UserLocationService } from "../../services/user/UserLocationService";

import { SingleUserResponse } from "../../types/responses/UserResponse";
import { LocationResponse } from "../../types/responses/LocationResponse";

import { promiseTimeout } from "../../utils/promiseTimeout";
import { RegisterUserInput } from "../../types/inputTypes/user/RegisterUserInput";
import {
  LoginUserDto,
  RegisterUserDto,
  VerifyUserDto,
} from "../../types/dtos/User";
import { LoginUserInput } from "../../types/inputTypes/user/LoginUserInput";
import { VerifyInputs } from "../../types/inputTypes/VerifyInputs";
import { LocationInput } from "../../types/inputTypes/user/LocationInput";
import { Context } from "../../types/context";
import { CustomError } from "../../utils/customError";
import { AddAddressInput } from "../../types/inputTypes/user/AddAddressInput";
import { UserRole } from "../../utils/enums";
import { TokenResponse } from "../../types/responses/TokenResponse";

@Service()
@Resolver()
export class UserMutationResolver {
  constructor(
    @Inject(() => UserAuthService)
    private userAuthService: UserAuthService,
    @Inject(() => UserLocationService)
    private userLocationService: UserLocationService
  ) {}

  @Mutation(() => SingleUserResponse)
  async registerUser(
    @Arg("data") data: RegisterUserInput
  ): Promise<SingleUserResponse> {
    let resolvedImage;

    if (data.profileImage) {
      resolvedImage = await promiseTimeout(data.profileImage, 15000);
    }

    const dto: RegisterUserDto = plainToInstance(RegisterUserDto, {
      ...data,
      profileImage: resolvedImage,
    });

    const user = await this.userAuthService.registerUser(dto);

    return user;
  }

  @Mutation(() => SingleUserResponse)
  async loginUser(
    @Arg("data") data: LoginUserInput
  ): Promise<SingleUserResponse> {
    const dto: LoginUserDto = plainToInstance(LoginUserDto, data);

    return this.userAuthService.loginUser(dto);
  }

  @Mutation(() => SingleUserResponse)
  async verifyUser(
    @Arg("data") data: VerifyInputs
  ): Promise<SingleUserResponse> {
    const dto = plainToInstance(VerifyUserDto, data);

    return this.userAuthService.verifyUser(dto);
  }

  @Mutation(() => TokenResponse)
  async refreshAccessToken(
    @Arg("refreshToken") refreshToken: string
  ): Promise<TokenResponse> {
    return this.userAuthService.refreshAccessToken(refreshToken);
  }

  

  @Mutation(() => LocationResponse)
  async getLocation(
    @Arg("data") data: LocationInput,
    @Ctx() ctx: Context
  ): Promise<LocationResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId || !userRole) throw new CustomError("Unauthenticated");

    const { latitude, longitude } = data;

    return this.userLocationService.getLocationByCoordinates({
      latitude,
      longitude,
      id: userId,
      userRole,
    });
  }

  @Mutation(() => LocationResponse)
  @Authorized([UserRole.USER, UserRole.PANDIT])
  async addAdress(
    @Arg("data") data: AddAddressInput,
    @Ctx() ctx: Context
  ): Promise<LocationResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId || !userRole) throw new CustomError("Unauthenticated");

    const { latitude, longitude, label, addressDetails, phoneNumber } = data;

    return this.userLocationService.addAddress({
      latitude,
      longitude,
      label,
      addressDetails,
      id: userId,
      userRole,
      phoneNumber,
    });
  }
}
