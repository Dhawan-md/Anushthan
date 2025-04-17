import { Authorized, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { PanditInfoProvider } from "../../providers/pandit/PanditInfoProvider";
import { MultiplePanditResponse } from "../../types/responses/PanditResponse";
import { AdminRole } from "../../utils/enums";

@Service()
@Resolver()
export class UserQueryResolver {
  constructor(
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider
  ) {}

  @Query(() => MultiplePanditResponse)
  @Authorized(AdminRole.ADMIN)
  async getAllPandits(): Promise<MultiplePanditResponse> {
    return this.panditInfoProvider.getAllPandits();
  }
}
