import { Arg, Authorized, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { PanditInfoProvider } from "../../providers/pandit/PanditInfoProvider";
import { UserInfoProvider } from "../../providers/user/UserInfoProvider";
import { ServiceProvider } from "../../providers/service/ServiceProvider";

import { MultiplePanditResponse } from "../../types/responses/PanditResponse";
import { MultipleDocumentResponse } from "../../types/responses/DocumentResponse";
import { MultipleServiceResponse } from "../../types/responses/ServiceResponse";
import { MultipleUserResponse } from "../../types/responses/UserResponse";

import { AdminRole } from "../../utils/enums";
import { GetAllPanditsInput } from "../../types/inputTypes/admin/GetAllPanditsInput";
import { plainToInstance } from "class-transformer";
import { GetAllPanditsDto, PaginationDto } from "../../types/dtos/Admin";
import { PaginationInput } from "../../types/inputTypes/PaginationInput";
import { GetDocumentInput } from "../../types/inputTypes/admin/GetDocumentInput";

@Service()
@Resolver()
export class AminQueryResolver {
  constructor(
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider,
    @Inject(() => ServiceProvider)
    private readonly serviceProvider: ServiceProvider,
    @Inject(() => UserInfoProvider)
    private readonly userInfoProvider: UserInfoProvider
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

  @Query(() => MultipleServiceResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async getAllServices(
    @Arg("data", () => PaginationInput, { nullable: true })
    data?: PaginationInput
  ): Promise<MultipleServiceResponse> {
    const dto = plainToInstance(PaginationDto, data || {});
    return this.serviceProvider.getAllServices(dto);
  }

  @Query(() => MultipleDocumentResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async getDocument(
    @Arg("data") data: GetDocumentInput
  ): Promise<MultipleDocumentResponse> {
    return this.panditInfoProvider.getDocument(data.filePathArray);
  }
}
