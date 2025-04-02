import { Arg, Authorized, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { AdminProvider } from "../../providers/admin/AdminProvider";
import { SingleAdminResponse } from "../../types/responses/AdminResponse";
import { ServiceResponse } from "../../types/responses/ServiceResponse";
import { ServiceProvider } from "../../providers/service/ServiceProvider";
// import { AdminRole } from "../../utils/enums";

@Service()
@Resolver()
export class AdminMutationResolver {
  constructor(
    @Inject(() => AdminProvider) private adminProvider: AdminProvider,
    @Inject(() => ServiceProvider) private serviceProvider: ServiceProvider
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

  @Mutation(() => ServiceResponse)
  @Authorized("ADMIN")
  async addService(
    @Arg("name") name: string,
    @Arg("description") description: string,
    @Arg("price") price: number,
    @Arg("duration") duration: number
  ) {
    return this.serviceProvider.addService({
      name,
      description,
      price,
      duration,
    });
  }
}
