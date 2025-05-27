import { Arg, Authorized, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { PanditInfoProvider } from "../../providers/pandit/PanditInfoProvider";
import { UserInfoProvider } from "../../providers/user/UserInfoProvider";
import { ServiceProvider } from "../../providers/service/ServiceProvider";

import { MultiplePanditResponse } from "../../types/responses/PanditResponse";
import { MultipleDocumentResponse } from "../../types/responses/DocumentResponse";
import { MultipleServiceResponse } from "../../types/responses/ServiceResponse";
import { MultipleUserResponse } from "../../types/responses/UserResponse";

import { AdminRole, PanditStatus } from "../../utils/enums";

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
    @Arg("page", { nullable: true }) page?: number,
    @Arg("limit", { nullable: true }) limit?: number,
    @Arg("status", { nullable: true }) status?: PanditStatus
  ): Promise<MultiplePanditResponse> {
    return this.panditInfoProvider.getAllPandits(page, limit, status);
  }

  @Query(() => MultipleUserResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async getAllUsers(
    @Arg("page", { nullable: true }) page?: number,
    @Arg("limit", { nullable: true }) limit?: number
  ): Promise<MultipleUserResponse> {
    const users = await this.userInfoProvider.getAllUsers(page, limit);

    return users;
  }

  @Query(() => MultipleServiceResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async getAllServices(
    @Arg("page", { nullable: true }) page?: number,
    @Arg("limit", { nullable: true }) limit?: number
  ): Promise<MultipleServiceResponse> {
    return this.serviceProvider.getAllServices(page, limit);
  }

  @Query(() => MultipleDocumentResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async getDocument(
    @Arg("filePathArray") filePathArray: string
  ): Promise<MultipleDocumentResponse> {
    return this.panditInfoProvider.getDocument(filePathArray);
  }
}
