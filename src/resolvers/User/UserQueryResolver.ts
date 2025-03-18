import { Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { UserInfoProvider } from "../../providers/user/UserInfoProvider";
import { MultipleUserResponse } from "../../types/responses/UserResponse";

@Service()
@Resolver()
export class UserQueryresolver {
  constructor(
    @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider
  ) {}

  @Query(() => MultipleUserResponse)
  async getAllUsers() {
    const users = this.userInfoProvider.getAllUsers();

    return users;
  }
}
