import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { PanditInfoProvider } from "./PanditInfoProvider";
import { UpdatePanditProvider } from "./UpdatePanditProvider";
import { UpdateUserProvider } from "../user/UpdateUserProvider";

import { Pandit } from "../../entities/Pandit";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SinglePanditResponse } from "../../types/responses/PanditResponse";

import { PanditStatus, UserRole } from "../../utils/enums";
import { logger } from "../../utils/logger";
import { STATUS_UPDATED } from "../../utils/messages";
import { SetPanditApprovalStatusDto } from "../../types/dtos/Admin";

@Service()
export class PanditActionProvider {
  private panditActionRepository: Repository<Pandit>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider,
    @Inject(() => UpdateUserProvider)
    private updateUserProvider: UpdateUserProvider,
    @Inject(() => UpdatePanditProvider)
    private updatePanditProvider: UpdatePanditProvider
  ) {
    this.panditActionRepository = this.repositoryFactory.getRepository(Pandit);
  }

  async setPanditApprovalStatus(params: SetPanditApprovalStatusDto) {
    const { panditId, status } = params;
    logger.info(`🔍 Verifying documents for pandit ${panditId}.`);

    const panditData = await this.panditInfoProvider.getPandit({
      data: { id: panditId },
      withUser: true,
    });

    await this.panditActionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        logger.info(`🔄 Updating status of pandit with ID: ${panditId}`);

        let updatedPanditFields: Partial<Pandit> = {
          status,
        };

        if (status === PanditStatus.REJECTED) {
          if (panditData.documents) {
            await this.updatePanditProvider.deleteDocument(
              panditData.documents
            );
          }
          updatedPanditFields.documents = null;
        } else if (status === PanditStatus.APPROVED) {
          await this.updateUserProvider.updateUser({
            updatedUserData: { userRole: UserRole.PANDIT },
            userId: panditData.user.id,
            manager: transactionalEntityManager,
          });
        }

        await this.updatePanditProvider.updatePandit(
          updatedPanditFields,
          panditData.id,
          transactionalEntityManager
        );
      }
    );

    await this.panditInfoProvider.notifyVendor({
      name: panditData.user.name,
      userEmail: panditData.user.userEmail,
      status,
    });

    logger.info(`✅ Verification complete for pandit ID: ${panditId}`);
    return new SinglePanditResponse(true, STATUS_UPDATED);
  }
}
