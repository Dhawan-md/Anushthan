import { Arg, Authorized, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";
import { plainToInstance } from "class-transformer";

import { AdminAuthService } from "../../services/admin/AdminAuthService";
import { ServiceActionService } from "../../services/service/ServiceActionService";
import { PanditActionService } from "../../services/pandit/PanditActionService";
import { CategoryActionProvdier } from "../../services/category/CategoryActionService";
import { TimeSlotService } from "../../services/admin/timeSlot/TimeSlotService";

import { SingleAdminResponse } from "../../types/responses/AdminResponse";
import { SingleServiceResponse } from "../../types/responses/ServiceResponse";
import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { SingleTimeSlotResponse } from "../../types/responses/TimeSlotResonse";

import { AdminRole } from "../../utils/enums";
import { RegisterAdminInput } from "../../types/inputTypes/admin/RegisterAdminInput";
import {
  AddServiceDto,
  CreateTimeSlotDto,
  RegisterAdminDto,
  SetPanditApprovalStatusDto,
} from "../../types/dtos/Admin";
import { AddServiceInput } from "../../types/inputTypes/service/AddServiceInput";
import { SetPanditApprovalStatusInput } from "../../types/inputTypes/admin/SetPanditApprovalStatusInput";
import { LoginAdminInput } from "../../types/inputTypes/admin/LoginAdminInput";
import { SingleCategoryResponse } from "../../types/responses/CategoryResponse";
import { AddCategoryInput } from "../../types/inputTypes/category/AddCategoryInput";
import { CreateTimeSlotInput } from "../../types/inputTypes/admin/timeSlot/CreateTimeSlotInput";

@Service()
@Resolver()
export class AdminMutationResolver {
  constructor(
    @Inject(() => AdminAuthService)
    private adminAuthService: AdminAuthService,
    @Inject(() => ServiceActionService)
    private serviceService: ServiceActionService,
    @Inject(() => PanditActionService)
    private panditActionService: PanditActionService,
    @Inject(() => CategoryActionProvdier)
    private categoryActionService: CategoryActionProvdier,
    @Inject(() => TimeSlotService) private timeSlotService: TimeSlotService
  ) {}

  @Mutation(() => SingleAdminResponse)
  @Authorized(AdminRole.SUPERADMIN)
  async registerAdmin(@Arg("data") data: RegisterAdminInput) {
    const dto: RegisterAdminDto = plainToInstance(RegisterAdminDto, data);

    return this.adminAuthService.registerAdmin(dto);
  }

  @Mutation(() => SingleAdminResponse)
  async loginAdmin(@Arg("data") data: LoginAdminInput) {
    const dto: RegisterAdminDto = plainToInstance(RegisterAdminDto, data);

    return this.adminAuthService.loginAdmin(dto);
  }

  @Mutation(() => SingleServiceResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async addService(
    @Arg("data") data: AddServiceInput
  ): Promise<SingleServiceResponse> {
    const dto = plainToInstance(AddServiceDto, data);

    return this.serviceService.addService(dto);
  }

  @Mutation(() => SingleCategoryResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async addCategory(
    @Arg("data") data: AddCategoryInput
  ): Promise<SingleCategoryResponse> {
    return this.categoryActionService.addCategory(data.name);
  }

  @Mutation(() => SinglePanditResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async setPanditApprovalStatus(
    @Arg("data") data: SetPanditApprovalStatusInput
  ): Promise<SinglePanditResponse> {
    const dto = plainToInstance(SetPanditApprovalStatusDto, data);

    return this.panditActionService.setPanditApprovalStatus(dto);
  }

  @Mutation(() => SingleTimeSlotResponse)
  @Authorized([AdminRole.ADMIN, AdminRole.SUPERADMIN])
  async createTimeSlot(
    @Arg("data") data: CreateTimeSlotInput
  ): Promise<SingleTimeSlotResponse> {
    const dto = plainToInstance(CreateTimeSlotDto, data);

    return this.timeSlotService.createTimeSlot(dto);
  }
}
