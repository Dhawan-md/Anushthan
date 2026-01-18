import { plainToInstance } from "class-transformer";
import { Resolver, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { Inject, Service } from "typedi";

import { UserAuthProvider } from "../../providers/user/UserAuthProvider";
import { UserLocationProvider } from "../../providers/user/UserLocationProvider";

import { SingleUserResponse } from "../../types/responses/UserResponse";
import {
  LocationCordinateResponse,
  LocationResponse,
} from "../../types/responses/LocationResponse";

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
import { SendUpdateOtpResponse } from "../../types/responses/OtpResponse";
import { UpdatedUserInput } from "../../types/inputTypes/user/UpdateUserInput";
import { UpdateUserProvider } from "../../providers/user/UpdateUserProvider";

@Service()
@Resolver()
export class UserMutationResolver {
  constructor(
    @Inject(() => UserAuthProvider)
    private userAuthProvider: UserAuthProvider,
    @Inject(() => UserLocationProvider)
    private userLocationProvider: UserLocationProvider,

    @Inject(() => UpdateUserProvider)
    private updateUserProvider: UpdateUserProvider
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

    const user = await this.userAuthProvider.registerUser(dto);

    return user;
  }

  @Mutation(() => SingleUserResponse)
  async loginUser(
    @Arg("data") data: LoginUserInput
  ): Promise<SingleUserResponse> {
    const dto: LoginUserDto = plainToInstance(LoginUserDto, data);

    return this.userAuthProvider.loginUser(dto);
  }

  @Mutation(() => SingleUserResponse)
  async verifyUser(
    @Arg("data") data: VerifyInputs
  ): Promise<SingleUserResponse> {
    const dto = plainToInstance(VerifyUserDto, data);

    return this.userAuthProvider.verifyUser(dto);
  }

  @Mutation(() => TokenResponse)
  async refreshAccessToken(
    @Arg("refreshToken") refreshToken: string
  ): Promise<TokenResponse> {
    return this.userAuthProvider.refreshAccessToken(refreshToken);
  }

  @Mutation(() => LocationResponse)
  async getLocation(
    @Arg("data") data: LocationInput,
    @Ctx() ctx: Context
  ): Promise<LocationCordinateResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId || !userRole) throw new CustomError("Unauthenticated");

    const { latitude, longitude } = data;

    return this.userLocationProvider.getLocationByCoordinates({
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

    return this.userLocationProvider.addAddress({
      latitude,
      longitude,
      label,
      addressDetails,
      id: userId,
      userRole,
      phoneNumber,
    });
  }

  @Mutation(() => LocationResponse)
  @Authorized([UserRole.USER, UserRole.PANDIT])
  async setSelectedAddress(
    @Arg("addressId") addressId: string,
    @Ctx() ctx: Context
  ): Promise<LocationResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId || !userRole) throw new CustomError("Unauthenticated");

    return this.userLocationProvider.setSelectedAddress({
      addressId,
      userId,
      userRole,
    });
  }

  @Mutation(() => LocationResponse)
  @Authorized([UserRole.USER, UserRole.PANDIT])
  async deleteAddress(
    @Arg("addressId") addressId: string,
    @Ctx() ctx: Context
  ): Promise<LocationResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId || !userRole) throw new CustomError("Unauthenticated");

    return this.userLocationProvider.deleteAddress({
      addressId,
      userId,
      userRole,
    });
  }

  @Mutation(() => SendUpdateOtpResponse)
  @Authorized(UserRole.USER)
  async sendUserUpdateOtp(
    @Arg("updatedFields") updatedFields: UpdatedUserInput,
    @Ctx() ctx: Context
  ): Promise<SendUpdateOtpResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId || !userRole) throw new CustomError("Unauthenticated");

    return this.updateUserProvider.sendUserUpdateOtp({
      userId,
      updatedFields,
    });
  }

  @Mutation(() => SingleUserResponse)
  @Authorized(UserRole.USER)
  async verifyUserUpdateOtp(
    @Arg("otp") otp: string,
    @Ctx() ctx: Context
  ): Promise<SingleUserResponse> {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError("Unauthenticated");

    return this.updateUserProvider.verifyUserUpdateOtp({
      userId,
      otp,
    });
  }
}
