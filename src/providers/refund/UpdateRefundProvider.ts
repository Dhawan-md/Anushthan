import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { RefundInfoProvider } from "./RefundInfoProvider";

import { Refund } from "../../entities/Refund";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleRefundResponse } from "../../types/responses/RefundResponse";

import { logger } from "../../utils/logger";
import { NO_DATA_TO_UPDATE, REFUND_UPDATED } from "../../utils/messages";
import { CustomError } from "../../utils/customError";

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
    refundId?: string;
    paymentReferenceId?: string;
    manager?: EntityManager;
  }): Promise<SingleRefundResponse> {
    const { updatedRefundData, refundId, manager, paymentReferenceId } = params;

    if (Object.keys(updatedRefundData).length === 0) {
      logger.warn(
        `[UpdateRefundProvider.ts] ⚠️ No fields provided for update. Refund ID: ${
          refundId || "unknown"
        }`
      );
      throw new CustomError(NO_DATA_TO_UPDATE);
    }

    logger.info(
      `[UpdateRefundProvider.ts] 🔄 Starting update for refund: ${
        refundId || paymentReferenceId || "unknown"
      }`
    );

    const em = manager || this.updateRefundRepository.manager;
    const repo = em.getRepository(Refund);

    const refundData = await this.refundInfoProvider.getRefund({
      refundId,
      paymentReferenceId,
      withRelation: true,
    });

    logger.debug(
      "[UpdateRefundProvider.ts] 🔍 Existing refund before update:",
      refundData
    );

    const mergedRefund = repo.merge(refundData, updatedRefundData);
    const updatedRefund = await repo.save(mergedRefund);

    logger.info(
      `[UpdateRefundProvider.ts] ✅ Successfully updated refund ${
        refundData.id
      } | Fields: ${Object.keys(updatedRefundData).join(", ")}`
    );

    return new SingleRefundResponse(true, REFUND_UPDATED, updatedRefund);
  }
}
