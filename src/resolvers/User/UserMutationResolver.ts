import { Resolver, Mutation, Arg } from "type-graphql";
import { Inject, Service } from "typedi";

import { UserSignInProvider } from "../../providers/user/UserSignInprovider";
import { SingleUserResponse } from "../../types/responses/UserResponse";
import { UpdateUserProvider } from "../../providers/user/UpdateUserProvider";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { promiseTimeout } from "../../utils/promiseTimeout";
import { ForgetPasswordProvider } from "../../providers/user/ForgetPasswordProvider";
import { VerifyResetResponse } from "../../types/responses/VerifyResetResponse";

@Service()
@Resolver()
export class UserMutationResolver {
  constructor(
    @Inject(() => UserSignInProvider)
    private userSignInProvider: UserSignInProvider,
    @Inject(() => UpdateUserProvider)
    private updateUserProvider: UpdateUserProvider,
    @Inject(() => ForgetPasswordProvider)
    private forgetPasswordProvider: ForgetPasswordProvider
  ) {}

  @Mutation(() => SingleUserResponse)
  async registerUser(
    @Arg("name") name: string,
    @Arg("username") username: string,
    @Arg("userEmail") userEmail: string,
    @Arg("phoneNumber") phoneNumber: string,
    @Arg("password") password: string,
    @Arg("profileImage", () => GraphQLUpload)
    profileImage: Promise<FileUpload>
  ): Promise<SingleUserResponse> {
    const resolvedImage = await promiseTimeout(profileImage, 15000);

    const user = await this.userSignInProvider.registerUser({
      name,
      username,
      password,
      userEmail,
      phoneNumber,
      profileImage: resolvedImage,
    });

    return user;
  }

  @Mutation(() => SingleUserResponse)
  async loginuser(
    @Arg("userEmail") userEmail: string,
    @Arg("password") password: string
  ): Promise<SingleUserResponse> {
    return await this.userSignInProvider.loginUser(userEmail, password);
  }

  @Mutation(() => SingleUserResponse)
  async verifyUser(
    @Arg("userEmail") userEmail: string,
    @Arg("otpCode") otpCode: string
  ): Promise<SingleUserResponse> {
    return await this.updateUserProvider.verifyUser(userEmail, otpCode);
  }

  @Mutation(() => SingleUserResponse)
  async forgetPassword(
    @Arg("userEmail") userEmail: string
  ): Promise<SingleUserResponse> {
    return await this.forgetPasswordProvider.forgetPassword(userEmail);
  }

  @Mutation(() => VerifyResetResponse)
  async verifyReset(
    @Arg("userEmail") userEmail: string,
    @Arg("otpCode") otpCode: string
  ): Promise<VerifyResetResponse> {
    return await this.forgetPasswordProvider.verifyResetPassword(
      userEmail,
      otpCode
    );
  }

  @Mutation(() => SingleUserResponse)
  async resetPassword(
    @Arg("newPassword") newPassword: string,
    @Arg("otpToken") otpToken: string
  ) {
    return await this.forgetPasswordProvider.resetPassword({
      newPassword,
      otpToken,
    });
  }
}
