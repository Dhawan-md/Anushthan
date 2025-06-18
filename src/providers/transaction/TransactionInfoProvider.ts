import { Service } from "typedi";
import { Repository } from "typeorm";
import { Transaction } from "../../entities/Transaction";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { MultipleTransactionResponse } from "../../types/responses/TransactionResponse";
import { logger } from "../../utils/logger";
import { getAllBookingTransactions } from "../../types/dtos/transaction";
import { CustomError } from "../../utils/customError";
import { NO_TRANSACTION_FOUND } from "../../utils/messages";

@Service()
export class TransactionInfoProvider {
  private transactionInfoRepository: Repository<Transaction>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.transactionInfoRepository =
      this.repositoryFactory.getRepository(Transaction);
  }

  async getAllBookingTransactions(
    params: getAllBookingTransactions
  ): Promise<MultipleTransactionResponse> {
    const { bookingId, page = 1, limit = 10 } = params;
    logger.info(
      `📦 Fetching transactions for booking ID: ${bookingId} | Page: ${page}, Limit: ${limit}`
    );

    const [bookingList, total] =
      await this.transactionInfoRepository.findAndCount({
        where: { bookingId },
        skip: (page - 1) * limit,
        take: limit,
      });

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `✅ Retrieved ${bookingList.length} bookings out of ${total} total.`
    );

    return new MultipleTransactionResponse(
      true,
      "Transaction List",
      bookingList,
      total,
      page,
      limit,
      totalPages
    );
  }

  async getTransaction(params: {
    transactionId?: string;
    orderId?: string;
  }): Promise<Transaction> {
    const { transactionId, orderId } = params;

    const transactionData = await this.transactionInfoRepository.findOne({
      where: [{ id: transactionId }, { orderId: orderId }],
    });

    if (!transactionData) {
      logger.warn(
        `❌ No transaction found with id: ${transactionId || orderId}`
      );
      throw new CustomError(NO_TRANSACTION_FOUND);
    }

    return transactionData;
  }
}
