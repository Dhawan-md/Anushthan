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
    const panditDetails = await this.panditInfoProvider.getPandit(
      { id: panditId },
      true
    );

    await this.panditActionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        logger.info(`🔄 Updating status of pandit with ID: ${panditId}`);

        if (status === PanditStatus.REJECTED) {
          panditDetails.documents = null;
        } else if (status === PanditStatus.APPROVED) {
          panditDetails.user.userRole = UserRole.PANDIT;
          await this.updateUserProvider.updateUser(
            panditDetails.user,
            panditDetails.user.id,
            transactionalEntityManager
          );
        }

        panditDetails.status = status;
        await transactionalEntityManager.save(Pandit, panditDetails);
      }
    );

    await this.panditInfoProvider.notifyVendor({
      name: panditDetails.user.name,
      userEmail: panditDetails.user.userEmail,
      status,
    });

    logger.info(`✅ Document verified successfully for pandit ${panditId}.`);
    return new SinglePanditResponse(true, STATUS_UPDATED);
  }
}
