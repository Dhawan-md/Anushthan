import { Arg, Authorized, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { PanditInfoProvider } from "../../providers/pandit/PanditInfoProvider";

import { MultiplePanditResponse } from "../../types/responses/PanditResponse";
import { MultipleDocumentResponse } from "../../types/responses/DocumentResponse";

import { AdminRole } from "../../utils/enums";

@Service()
@Resolver()
export class UserQueryResolver {
  constructor(
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider
  ) {}

  @Query(() => MultiplePanditResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async getAllPandits(): Promise<MultiplePanditResponse> {
    return this.panditInfoProvider.getAllPandits();
  }

  @Query(() => MultiplePanditResponse)
  @Authorized([AdminRole.SUPERADMIN, AdminRole.ADMIN])
  async getDocument(
    @Arg("filePathArray") filePathArray: string
  ): Promise<MultipleDocumentResponse> {
    return this.panditInfoProvider.getDocument(filePathArray);
  }
}
