import { Resolver, Mutation, Arg } from "type-graphql";
import { Inject, Service } from "typedi";

import { UserSignInProvider } from "../../providers/user/UserSignInprovider";
import { SingleUserResponse } from "../../types/responses/UserResponse";

@Service()
@Resolver()
export class UserMutationResolver {
  constructor(
    @Inject(() => UserSignInProvider)
    private userSignInProvider: UserSignInProvider
  ) {}

  @Mutation(() => SingleUserResponse)
  async registerUser(
    @Arg("name") name: string,
    @Arg("username") username: string,
    @Arg("userEmail") userEmail: string,
    @Arg("phoneNumber") phoneNumber:string,
    @Arg("password") password: string
  ): Promise<SingleUserResponse> {
    const user = await this.userSignInProvider.registerUser({
      name,
      username,
      password,
      userEmail,
      phoneNumber
    });

    return user;
  }
}
