import { Resolver, Mutation, Arg } from "type-graphql";
import { Inject, Service } from "typedi";

import { UserAuthProvider } from "../../providers/user/UserSignInProvider";
import { SingleUserResponse } from "../../types/responses/UserResponse";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { promiseTimeout } from "../../utils/promiseTimeout";
import { UpdateUserProvider } from "../../providers/user/UpdateUserProvider";

@Service()
@Resolver()
export class UserMutationResolver {
  constructor(
    @Inject(() => UserAuthProvider)
    private userAuthProvider: UserAuthProvider,
    @Inject(() => UpdateUserProvider)
    private updateUserProvider: UpdateUserProvider 
  ) {}

  @Mutation(() => SingleUserResponse)
  async registerUser(
    @Arg("name") name: string,
    @Arg("username") username: string,
    @Arg("userEmail") userEmail: string,
    @Arg("phoneNumber") phoneNumber: string,
    @Arg("profileImage", () => GraphQLUpload, { nullable: true })
    profileImage?: Promise<FileUpload>
  ): Promise<SingleUserResponse> {
    let resolvedImage;

    if (profileImage) {
      resolvedImage = await promiseTimeout(profileImage, 15000);
    }

    const user = await this.userAuthProvider.registerUser({
      name,
      username,
      userEmail,
      phoneNumber,
      profileImage: resolvedImage || null,
    });

    return user;
  }

  @Mutation(() => SingleUserResponse)
  async loginuser(
    @Arg("userEmail") userEmail: string
  ): Promise<SingleUserResponse> {
    return this.userAuthProvider.loginUser(userEmail);
  }

  @Mutation(() => SingleUserResponse)
  async verifyUser(
    @Arg("userEmail") userEmail: string,
    @Arg("otpCode") otpCode: string
  ): Promise<SingleUserResponse> {
    return this.updateUserProvider.verifyUser(userEmail, otpCode);
  }
}
