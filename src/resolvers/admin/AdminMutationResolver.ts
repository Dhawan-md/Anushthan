import { Arg, Authorized, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";
import { plainToInstance } from "class-transformer";

import { AdminAuthProvider } from "../../providers/admin/AdminAuthProvider";
import { ServiceActionProvider } from "../../providers/service/ServiceActionProvider";
import { PanditActionProvider } from "../../providers/pandit/PanditActionProvider";
import { CategoryActionProvdier } from "../../providers/category/CategoryActionProvider";

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
import { AddServiceInput } from "../../types/inputTypes/service/AddServiceInput";
import { SetPanditApprovalStatusInput } from "../../types/inputTypes/admin/SetPanditApprovalStatusInput";
import { LoginAdminInput } from "../../types/inputTypes/admin/LoginAdminInput";
import { SingleCategoryResponse } from "../../types/responses/CategoryResponse";
import { AddCategoryInput } from "../../types/inputTypes/category/AddCategoryInput";

@Service()
@Resolver()
export class AdminMutationResolver {
  constructor(
    @Inject(() => AdminAuthProvider)
    private adminAuthProvider: AdminAuthProvider,
    @Inject(() => ServiceActionProvider)
    private serviceProvider: ServiceActionProvider,
    @Inject(() => PanditActionProvider)
    private panditActionProvider: PanditActionProvider,
    @Inject(() => CategoryActionProvdier)
    private categoryActionProvider: CategoryActionProvdier
  ) {}

  @Mutation(() => SingleAdminResponse)
  @Authorized(AdminRole.SUPERADMIN)
  async registerAdmin(@Arg("data") data: RegisterAdminInput) {
    const dto: RegisterAdminDto = plainToInstance(RegisterAdminDto, data);

    return this.adminAuthProvider.registerAdmin(dto);
  }

  @Mutation(() => SingleAdminResponse)
  async loginAdmin(@Arg("data") data: LoginAdminInput) {
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

  @Mutation(() => SingleCategoryResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async addCategory(
    @Arg("data") data: AddCategoryInput
  ): Promise<SingleCategoryResponse> {
    return this.categoryActionProvider.addCategory(data.name);
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
