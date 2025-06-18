import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { TransactionInfoProvider } from "./TransactionInfoProvider";

import { Transaction } from "../../entities/Transaction";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleTransactionResponse } from "../../types/responses/TransactionResponse";

import { logger } from "../../utils/logger";
import { NO_DATA_TO_UPDATE, PANDIT_UPDATED } from "../../utils/messages";
import { CustomError } from "../../utils/customError";

@Service()
export class UpdateTransactionProvider {
  private updateTransactionRepository: Repository<Transaction>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => TransactionInfoProvider)
    private transactionInfoProvider: TransactionInfoProvider
  ) {
    this.updateTransactionRepository =
      this.repositoryFactory.getRepository(Transaction);
  }

  async updateTransaction(params: {
    updatedTransactionData: Partial<Transaction>;
    transactionId?: string;
    orderId?: string;
    manager?: EntityManager;
  }): Promise<SingleTransactionResponse> {
    const { updatedTransactionData, transactionId, orderId, manager } = params;
    logger.info(`🔄 Updating transaction with ID: ${transactionId || orderId}`);

    if (Object.keys(updatedTransactionData).length === 0) {
      logger.warn(
        `⚠️ No fields provided to update for transaction ${
          transactionId || orderId
        }`
      );
      throw new CustomError(NO_DATA_TO_UPDATE);
    }

    const em = manager || this.updateTransactionRepository.manager;
    const transactionData = await this.transactionInfoProvider.getTransaction({
      transactionId,
      orderId,
    });

    Object.assign(transactionData, updatedTransactionData);

    const updatedTransaction = await em.save(Transaction, transactionData);

    logger.info(
      `📝 Fields updated for transaction ${
        transactionId || orderId
      }: ${Object.keys(updatedTransactionData).join(", ")}`
    );
    logger.info(
      `✅ Successfully updated transaction with ID: ${transactionId || orderId}`
    );
    return new SingleTransactionResponse(
      true,
      PANDIT_UPDATED,
      updatedTransaction
    );
  }
}
