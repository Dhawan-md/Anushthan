import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { Pandit } from "../../entities/Pandit";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";
import { PANDIT_UPDATED } from "../../utils/messages";
import { PanditInfoProvider } from "./PanditInfoProvider";
import { SinglePanditResponse } from "../../types/responses/PanditResponse";

@Service()
export class UpdatePanditProvider {
  private updatePanditRepository: Repository<Pandit>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider
  ) {
    this.updatePanditRepository = this.repositoryFactory.getRepository(Pandit);
  }

  async updatePandit(
    updatedPanditData: Partial<Pandit>,
    panditId: string,
    manager?: EntityManager
  ): Promise<SinglePanditResponse> {
    logger.info(`🔄 Updating pandit with ID: ${panditId}`);
    const em = manager || this.updatePanditRepository.manager;
    const panditData = await this.panditInfoProvider.getPandit({
      id: panditId,
    });

    Object.assign(panditData, updatedPanditData);

    const updatedPandit = await em.save(Pandit, panditData);

    logger.info(`✅ Successfully updated pandit with ID: ${panditData}`);
    return new SinglePanditResponse(true, PANDIT_UPDATED, updatedPandit);
  }
}
