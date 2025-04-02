import { Arg, Authorized, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { AdminProvider } from "../../providers/admin/AdminProvider";
import { SingleAdminResponse } from "../../types/responses/AdminResponse";
// import { AdminRole } from "../../utils/enums";

@Service()
@Resolver()
export class AdminMutationResolver {
  constructor(
    @Inject(() => AdminProvider) private adminProvider: AdminProvider
  ) {}

  @Mutation(() => SingleAdminResponse)
  @Authorized("SUPERADMIN")
  async registerAdmin(
    @Arg("fullName") fullName: string,
    @Arg("email") email: string,
    @Arg("password") password: string
  ) {
    return await this.adminProvider.registerAdmin({
      fullName,
      email,
      password,
    });
  }

  @Mutation(() => SingleAdminResponse)
  async loginAdmin(
    @Arg("email") email: string,
    @Arg("password") password: string
  ) {
    return await this.adminProvider.loginAdmin(email, password);
  }
}
