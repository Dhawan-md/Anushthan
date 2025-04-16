import { Arg, Authorized, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { AdminAuthProvider } from "../../providers/admin/AdminAuthProvider";
import { SingleAdminResponse } from "../../types/responses/AdminResponse";
import { SingleServiceResponse } from "../../types/responses/ServiceResponse";
import { ServiceProvider } from "../../providers/service/ServiceProvider";
import { AdminRole } from "../../utils/enums";

@Service()
@Resolver()
export class AdminMutationResolver {
  constructor(
    @Inject(() => AdminAuthProvider) private adminAuthProvider: AdminAuthProvider,
    @Inject(() => ServiceProvider) private serviceProvider: ServiceProvider
  ) {}

  @Mutation(() => SingleAdminResponse)
  @Authorized(AdminRole.SUPERADMIN)
  async registerAdmin(
    @Arg("fullName") fullName: string,
    @Arg("email") email: string,
    @Arg("password") password: string
  ) {
    return this.adminAuthProvider.registerAdmin({
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
    return this.adminAuthProvider.loginAdmin(email, password);
  }

  @Mutation(() => SingleServiceResponse)
  @Authorized(AdminRole.ADMIN)
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
