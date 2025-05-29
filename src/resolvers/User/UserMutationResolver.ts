import { Resolver, Mutation, Arg } from "type-graphql";
import { Inject, Service } from "typedi";

import { UserAuthProvider } from "../../providers/user/UserAuthProvider";

import { SingleUserResponse } from "../../types/responses/UserResponse";

import { promiseTimeout } from "../../utils/promiseTimeout";
import { RegisterUserInput } from "../../types/inputTypes/user/RegisterUserInput";
import { LoginUserDto, RegisterUserDto, VerifyUserDto } from "../../types/dtos/User";
import { plainToInstance } from "class-transformer";
import { LoginUserInput } from "../../types/inputTypes/user/LoginUserInput";
import { VerifyInputs } from "../../types/inputTypes/VerifyInputs";

@Service()
@Resolver()
export class UserMutationResolver {
  constructor(
    @Inject(() => UserAuthProvider)
    private userAuthProvider: UserAuthProvider
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
}
