import { Arg, Authorized, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";
import { plainToInstance } from "class-transformer";

import { AdminAuthProvider } from "../../providers/admin/AdminAuthProvider";
import { ServiceProvider } from "../../providers/service/ServiceProvider";
import { PanditActionProvider } from "../../providers/pandit/PanditActionProvider";

import { SingleAdminResponse } from "../../types/responses/AdminResponse";
import { SingleServiceResponse } from "../../types/responses/ServiceResponse";
import { SinglePanditResponse } from "../../types/responses/PanditResponse";

import { AdminRole } from "../../utils/enums";
import { RegisterAdminInput } from "../../types/inputTypes/admin/RegisterAdminInput";
import {
  AddServiceDto,
  RegisterAdminDto,
  SetPanditApprovalStatusDto,
} from "../../types/dtos/Admin";
import { AddServiceInput } from "../../types/inputTypes/admin/AddServiceInput";
import { SetPanditApprovalStatusInput } from "../../types/inputTypes/admin/SetPanditApprovalStatusInput";

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
  async registerAdmin(@Arg("data") data: RegisterAdminInput) {
    const dto: RegisterAdminDto = plainToInstance(RegisterAdminDto, data);

    return this.adminAuthProvider.registerAdmin(dto);
  }

  @Mutation(() => SingleAdminResponse)
  async loginAdmin(@Arg("data") data: RegisterAdminInput) {
    const dto: RegisterAdminDto = plainToInstance(RegisterAdminDto, data);

    return this.adminAuthProvider.loginAdmin(dto);
  }

  @Mutation(() => SingleServiceResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async addService(
    @Arg("data") data: AddServiceInput
  ): Promise<SingleServiceResponse> {
    const dto = plainToInstance(AddServiceDto, data);

    return this.serviceProvider.addService(dto);
  }

  @Mutation(() => SinglePanditResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async setPanditApprovalStatus(
    @Arg("data") data: SetPanditApprovalStatusInput
  ): Promise<SinglePanditResponse> {
    const dto = plainToInstance(SetPanditApprovalStatusDto, data);

    return this.panditActionProvider.setPanditApprovalStatus(dto);
  }
}
