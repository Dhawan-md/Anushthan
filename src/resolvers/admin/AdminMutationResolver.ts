import { Arg, Authorized, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { AdminAuthProvider } from "../../providers/admin/AdminAuthProvider";
import { ServiceProvider } from "../../providers/service/ServiceProvider";
import { PanditActionProvider } from "../../providers/pandit/PanditActionProvider";

import { SingleAdminResponse } from "../../types/responses/AdminResponse";
import { SingleServiceResponse } from "../../types/responses/ServiceResponse";
import { SinglePanditResponse } from "../../types/responses/PanditResponse";

import { AdminRole, PanditStatus } from "../../utils/enums";

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
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async addService(
    @Arg("name") name: string,
    @Arg("description") description: string,
    @Arg("price") price: number,
    @Arg("duration") duration: number
  ): Promise<SingleServiceResponse> {
    console.log("something");

    return this.serviceProvider.addService({
      name,
      description,
      price,
      duration,
    });
  }

  @Mutation(() => SinglePanditResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async setPanditApprovalStatus(
    @Arg("panditId") panditId: string,
    @Arg("status") status: PanditStatus
  ): Promise<SinglePanditResponse> {
    return this.panditActionProvider.setPanditApprovalStatus(panditId, status);
  }
}
