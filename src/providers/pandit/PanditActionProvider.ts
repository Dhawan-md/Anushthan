import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { Pandit } from "../../entities/Pandit";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { PanditInfoProvider } from "./PanditInfoProvider";
import { PanditStatus, UserRole } from "../../utils/enums";
import { logger } from "../../utils/logger";
import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { STATUS_UPDATED } from "../../utils/messages";
import { UpdateUserProvider } from "../user/UpdateUserProvider";

@Service()
export class PanditActionProvider {
  private panditActionRepository: Repository<Pandit>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider,
    @Inject(() => UpdateUserProvider)
    private updateUserProvider: UpdateUserProvider
  ) {
    this.panditActionRepository = this.repositoryFactory.getRepository(Pandit);
  }

  async verifyPandit(panditId: string, status: PanditStatus) {
    logger.info(`🔍 Verifying documents for pandit ${panditId}.`);
    const panditData = await this.panditInfoProvider.getPandit(
      { id: panditId },
      true
    );

    await this.panditActionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        logger.info(`🔄 Updating status of pandit with ID: ${panditId}`);

        if (status === PanditStatus.REJECTED) {
          panditData.documents = null;
        } else if (status === PanditStatus.APPROVED) {
          panditData.user.userRole = UserRole.PANDIT;
          await this.updateUserProvider.updateUser(
            panditData.user,
            panditData.user.id,
            transactionalEntityManager
          );
        }

        panditData.status = status;
        await transactionalEntityManager.save(Pandit, panditData);
      }
    );

    await this.panditInfoProvider.notifyVendor({
      name: panditData.user.name,
      userEmail: panditData.user.userEmail,
      status,
    });

    logger.info(`✅ Document verified successfully for pandit ${panditId}.`);
    return new SinglePanditResponse(true, STATUS_UPDATED);
  }
}
