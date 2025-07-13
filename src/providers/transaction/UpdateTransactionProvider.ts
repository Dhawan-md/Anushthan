import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { TransactionInfoProvider } from "./TransactionInfoProvider";

import { Transaction } from "../../entities/Transaction";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleTransactionResponse } from "../../types/responses/TransactionResponse";

import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import {
  INTERNAL_ERROR_OCCURRED,
  NO_DATA_TO_UPDATE,
  PANDIT_UPDATED,
} from "../../utils/messages";

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
    logger.info(
      `[UpdateTransactionProvider.ts] 🔄 Updating transaction with ID: ${
        transactionId || orderId
      }`
    );

    if (Object.keys(updatedTransactionData).length === 0) {
      logger.warn(
        `[UpdateTransactionProvider.ts] ⚠️ No fields provided to update for transaction ${
          transactionId || orderId
        }`
      );
      throw new CustomError(NO_DATA_TO_UPDATE);
    }
    try {
      const em = manager || this.updateTransactionRepository.manager;
      const repo = em.getRepository(Transaction);

      const transactionData = await this.transactionInfoProvider.getTransaction(
        {
          transactionId,
          orderId,
        }
      );

      const mergedTransaction = repo.merge(
        transactionData,
        updatedTransactionData
      );

      const updatedTransaction = await repo.save(mergedTransaction);

      logger.info(
        `[UpdateTransactionProvider.ts] 📝 Fields updated for transaction ${
          transactionId || orderId
        }: ${Object.keys(updatedTransactionData).join(", ")}`
      );

      logger.info(
        `[UpdateTransactionProvider.ts] ✅ Successfully updated transaction with ID: ${
          transactionId || orderId
        }`
      );

      return new SingleTransactionResponse(
        true,
        PANDIT_UPDATED,
        updatedTransaction
      );
    } catch (error: any) {
      logger.error(
        `[UpdateTransactionProvider.ts] ❌ Failed to update transaction: ${error.message}`,
        error
      );
      throw new CustomError(INTERNAL_ERROR_OCCURRED);
    }
  }
}
