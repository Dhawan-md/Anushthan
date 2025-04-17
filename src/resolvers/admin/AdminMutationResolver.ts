import { Arg, Authorized, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { AdminAuthProvider } from "../../providers/admin/AdminAuthProvider";
import { SingleAdminResponse } from "../../types/responses/AdminResponse";
import { SingleServiceResponse } from "../../types/responses/ServiceResponse";
import { ServiceProvider } from "../../providers/service/ServiceProvider";
import { AdminRole, PanditStatus } from "../../utils/enums";
import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { PanditActionProvider } from "../../providers/pandit/PanditActionProvider";

@Service()
@Resolver()
export class AdminMutationResolver {
  constructor(
    @Inject(() => AdminAuthProvider)
    private adminAuthProvider: AdminAuthProvider,
    @Inject(() => ServiceProvider) private serviceProvider: ServiceProvider,
    @Inject(() => PanditActionProvider)
    private panditActionProvider: PanditActionProvider
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

  @Mutation(() => SinglePanditResponse)
  @Authorized(AdminRole.ADMIN)
  async verifyPandit(
    @Arg("panditId") panditId: string,
    @Arg("status") status: PanditStatus
  ): Promise<SinglePanditResponse> {
    return this.panditActionProvider.verifyPandit(panditId, status);
  }
}
