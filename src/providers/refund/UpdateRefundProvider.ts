import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { Refund } from "../../entities/Refund";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";
import { NO_DATA_TO_UPDATE, PANDIT_UPDATED } from "../../utils/messages";
import { CustomError } from "../../utils/customError";
import { RefundInfoProvider } from "./RefundInfoProvider";
import { SingleRefundResponse } from "../../types/responses/RefundResponse";

@Service()
export class UpdateRefundProvider {
  private updateRefundRepository: Repository<Refund>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => RefundInfoProvider)
    private refundInfoProvider: RefundInfoProvider
  ) {
    this.updateRefundRepository = this.repositoryFactory.getRepository(Refund);
  }

  async updateRefund(params: {
    updatedRefundData: Partial<Refund>;
    refundId: string;
    manager?: EntityManager;
  }): Promise<SingleRefundResponse> {
    const { updatedRefundData, refundId, manager } = params;
    logger.info(`🔄 Updating refund with ID: ${refundId}`);

    if (Object.keys(updatedRefundData).length === 0) {
      logger.warn(`⚠️ No fields provided to update for refund ${refundId}`);
      throw new CustomError(NO_DATA_TO_UPDATE);
    }

    const em = manager || this.updateRefundRepository.manager;
    const refundData = await this.refundInfoProvider.getRefund({
      refundId,
      withRelation: true,
    });

    Object.assign(refundData, updatedRefundData);

    const updatedRefund = await em.save(Refund, refundData);

    logger.info(
      `📝 Fields updated for refund ${refundId}: ${Object.keys(
        updatedRefundData
      ).join(", ")}`
    );
    logger.info(`✅ Successfully updated refund with ID: ${refundId}`);

    return new SingleRefundResponse(true, PANDIT_UPDATED, updatedRefund);
  }
}
