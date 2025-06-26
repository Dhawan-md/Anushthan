import { Service } from "typedi";
import { Repository } from "typeorm";
import { Refund } from "../../entities/Refund";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { NO_TRANSACTION_FOUND } from "../../utils/messages";
import { RefundStatus } from "../../utils/enums";
import { MultipleRefundResponse } from "../../types/responses/RefundResponse";
import { getAllTransactionRefunds } from "../../types/dtos/Refund";

@Service()
export class RefundInfoProvider {
  private refundInfoRepository: Repository<Refund>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.refundInfoRepository = this.repositoryFactory.getRepository(Refund);
  }

  async getAllTransactionRefunds(
    params: getAllTransactionRefunds
  ): Promise<MultipleRefundResponse> {
    const { transactionId, page = 1, limit = 10 } = params;

    logger.info(
      `📦 Fetching refund list | Transaction ID: ${transactionId} | Page: ${page} | Limit: ${limit}`
    );

    const [refunds, total] = await this.refundInfoRepository.findAndCount({
      where: { transactionId },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    logger.info(
      `✅ Found ${refunds.length} refunds for transaction ${transactionId} | Total: ${total}, Total Pages: ${totalPages}`
    );

    return new MultipleRefundResponse(
      true,
      "Refund List",
      refunds,
      total,
      page,
      limit,
      totalPages
    );
  }

  async getRefund(params: {
    refundId?: string;
    paymentReferenceId?: string;
    withRelation?: boolean;
  }): Promise<Refund> {
    const { refundId, withRelation = false, paymentReferenceId } = params;

    logger.info(
      `🔍 Fetching refund | Refund ID: ${
        refundId ?? "-"
      } | Payment Reference ID: ${
        paymentReferenceId ?? "-"
      } | With Relation: ${withRelation}`
    );

    const whereConditions: Partial<Refund>[] = [];

    if (refundId) {
      whereConditions.push({ id: refundId, status: RefundStatus.PENDING });
    }

    if (paymentReferenceId) {
      whereConditions.push({
        paymentReferenceId,
        status: RefundStatus.PENDING,
      });
    }

    const refund = await this.refundInfoRepository.findOne({
      where: whereConditions,
      ...(withRelation ? { relations: ["transaction"] } : {}),
    });

    if (!refund) {
      logger.warn(
        `❌ Refund not found | Refund ID: ${
          refundId ?? "-"
        } | Payment Reference ID: ${paymentReferenceId ?? "-"}`
      );
      throw new CustomError(NO_TRANSACTION_FOUND);
    }

    logger.info(`✅ Refund found | ID: ${refund.id}`);
    return refund;
  }
}
