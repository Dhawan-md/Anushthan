import { Arg, Authorized, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { PanditInfoProvider } from "../../providers/pandit/PanditInfoProvider";
import { UserInfoProvider } from "../../providers/user/UserInfoProvider";
import { TimeSlotProvider } from "../../providers/admin/timeSlot/TimeSlotProvider";

import { MultiplePanditResponse } from "../../types/responses/PanditResponse";
import { MultipleDocumentResponse } from "../../types/responses/DocumentResponse";
import { MultipleUserResponse } from "../../types/responses/UserResponse";
import { MultipleTimeSlotResponse } from "../../types/responses/TimeSlotResonse";

import { AdminRole, UserRole } from "../../utils/enums";
import { GetAllPanditsInput } from "../../types/inputTypes/admin/GetAllPanditsInput";
import { plainToInstance } from "class-transformer";
import { GetAllPanditsDto } from "../../types/dtos/Admin";
import { PaginationInput } from "../../types/inputTypes/PaginationInput";
import { GetDocumentInput } from "../../types/inputTypes/admin/GetDocumentInput";
import { PaginationDto } from "../../types/dtos/Pagination";

@Service()
@Resolver()
export class AminQueryResolver {
  constructor(
    @Inject(() => PanditInfoProvider)
    private readonly panditInfoProvider: PanditInfoProvider,
    @Inject(() => UserInfoProvider)
    private readonly userInfoProvider: UserInfoProvider,
    @Inject(() => TimeSlotProvider)
    private readonly timeSlotProvider: TimeSlotProvider
  ) {}

  @Query(() => MultiplePanditResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async getAllPandits(
    @Arg("data", () => GetAllPanditsInput, { nullable: true })
    data?: GetAllPanditsInput
  ): Promise<MultiplePanditResponse> {
    const dto = plainToInstance(GetAllPanditsDto, data || {});
    return this.panditInfoProvider.getAllPandits(dto);
  }

  @Query(() => MultipleUserResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async getAllUsers(
    @Arg("data", () => PaginationInput, { nullable: true })
    data?: PaginationInput
  ): Promise<MultipleUserResponse> {
    const dto = plainToInstance(PaginationDto, data || {});
    return this.userInfoProvider.getAllUsers(dto);
  }

  @Query(() => MultipleDocumentResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async getDocument(
    @Arg("data") data: GetDocumentInput
  ): Promise<MultipleDocumentResponse> {
    return this.panditInfoProvider.getDocument(data.filePathArray);
  }

  @Query(() => MultipleTimeSlotResponse)
  @Authorized([AdminRole.ADMIN, AdminRole.SUPERADMIN, UserRole.USER])
  async getAllTimeSlots(): Promise<MultipleTimeSlotResponse> {
    return this.timeSlotProvider.getAllTimeSlots();
  }
}
