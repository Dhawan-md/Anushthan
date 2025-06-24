import { Service } from "typedi";
import { Repository } from "typeorm";
import { Refund } from "../../entities/Refund";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { NO_TRANSACTION_FOUND } from "../../utils/messages";
// import { RefundStatus } from "../../utils/enums";

@Service()
export class RefundInfoProvider {
  private refundInfoRepository: Repository<Refund>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.refundInfoRepository = this.repositoryFactory.getRepository(Refund);
  }

  // async getAllBookingRefunds(
  //   params: getAllBookingRefunds
  // ): Promise<MultipleRefundResponse> {
  //   const { bookingId, page = 1, limit = 10 } = params;
  //   logger.info(
  //     `📦 Fetching refunds for booking ID: ${bookingId} | Page: ${page}, Limit: ${limit}`
  //   );

  //   const [bookingList, total] = await this.refundInfoRepository.findAndCount({
  //     where: { bookingId },
  //     skip: (page - 1) * limit,
  //     take: limit,
  //   });

  //   const totalPages = Math.ceil(total / limit);

  //   logger.info(
  //     `✅ Retrieved ${bookingList.length} bookings out of ${total} total.`
  //   );

  //   return new MultipleRefundResponse(
  //     true,
  //     "Refund List",
  //     bookingList,
  //     total,
  //     page,
  //     limit,
  //     totalPages
  //   );
  // }

  async getRefund(params: {
    refundId: string;
    withRelation?: boolean;
  }): Promise<Refund> {
    const { refundId, withRelation = false } = params;

    const refundData = await this.refundInfoRepository.findOne({
      where: { id: refundId },
      ...(withRelation ? { relations: ["transaction"] } : {}),
    });

    if (!refundData) {
      logger.warn(`❌ No refund found with id: ${refundId}`);
      throw new CustomError(NO_TRANSACTION_FOUND);
    }

    return refundData;
  }
}
