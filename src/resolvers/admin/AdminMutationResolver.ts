import { Arg, Authorized, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { AdminProvider } from "../../providers/admin/AdminProvider";
import { SingleAdminResponse } from "../../types/responses/AdminResponse";
import { SingleServiceResponse } from "../../types/responses/ServiceResponse";
import { ServiceProvider } from "../../providers/service/ServiceProvider";
import { Role } from "../../utils/enums";

@Service()
@Resolver()
export class AdminMutationResolver {
  constructor(
    @Inject(() => AdminProvider) private adminProvider: AdminProvider,
    @Inject(() => ServiceProvider) private serviceProvider: ServiceProvider
  ) {}

  @Mutation(() => SingleAdminResponse)
  @Authorized(Role.SUPERADMIN)
  async registerAdmin(
    @Arg("fullName") fullName: string,
    @Arg("email") email: string,
    @Arg("password") password: string
  ) {
    return this.adminProvider.registerAdmin({
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
    return this.adminProvider.loginAdmin(email, password);
  }

  @Mutation(() => SingleServiceResponse)
  @Authorized(Role.ADMIN)
  async addService(
    @Arg("name") name: string,
    @Arg("description") description: string,
    @Arg("price") price: number,
    @Arg("duration") duration: number
  ): Promise<SingleServiceResponse> {
    return this.serviceProvider.addService({
      name,
      description,
      price,
      duration,
    });
  }
}
