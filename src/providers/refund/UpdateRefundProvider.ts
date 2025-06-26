import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { Refund } from "../../entities/Refund";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";
import { NO_DATA_TO_UPDATE, REFUND_UPDATED } from "../../utils/messages";
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
    refundId?: string;
    paymentReferenceId?: string;
    manager?: EntityManager;
  }): Promise<SingleRefundResponse> {
    const { updatedRefundData, refundId, manager, paymentReferenceId } = params;

    if (Object.keys(updatedRefundData).length === 0) {
      logger.warn(
        `⚠️ No fields provided for update. Refund ID: ${refundId || "unknown"}`
      );
      throw new CustomError(NO_DATA_TO_UPDATE);
    }

    logger.info(
      `🔄 Starting update for refund: ${
        refundId || paymentReferenceId || "unknown"
      }`
    );

    const em = manager || this.updateRefundRepository.manager;

    const refundData = await this.refundInfoProvider.getRefund({
      refundId,
      paymentReferenceId,
      withRelation: true,
    });

    logger.debug("🔍 Existing refund before update:", refundData);

    Object.assign(refundData, updatedRefundData);

    const updatedRefund = await em.save(Refund, refundData);

    logger.info(
      `✅ Successfully updated refund ${refundData.id} | Fields: ${Object.keys(
        updatedRefundData
      ).join(", ")}`
    );

    return new SingleRefundResponse(true, REFUND_UPDATED, updatedRefund);
  }
}
