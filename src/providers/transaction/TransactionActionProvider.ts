import { Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { Transaction } from "../../entities/Transaction";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import {
  TransactionStatus,
  TransactionType,
  UserRole,
} from "../../utils/enums";
import { INTERNAL_ERROR_OCCURRED } from "../../utils/messages";

@Service()
export class TransactionActionProvider {
  private transactionActionRepository: Repository<Transaction>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.transactionActionRepository =
      this.repositoryFactory.getRepository(Transaction);
  }

  async createPaymentTransaction(params: {
    userId: string;
    userRole: UserRole;
    bookingId: string;
    amount: number;
    type?: TransactionType;
    manager?: EntityManager;
  }): Promise<Transaction> {
    const {
      userId,
      userRole,
      bookingId,
      amount,
      manager,
      type = TransactionType.PAYMENT_INCOMING,
    } = params;

    logger.info(
      `[TransactionActionProvider.ts] 🧾 Initiating transaction creation | userId: ${userId}, bookingId: ${bookingId}, amount: ₹${amount}, role: ${userRole}, type: ${type}`
    );

    const em = manager || this.transactionActionRepository.manager;
    const repo = em.getRepository(Transaction);

    try {
      const transaction = repo.create({
        userId,
        userRole,
        bookingId,
        amount,
        type,
        status: TransactionStatus.PENDING,
        booking: { id: bookingId },
      });

      logger.debug(
        `[TransactionActionProvider.ts] 📦 Transaction entity created (not saved yet) | bookingId: ${bookingId}`
      );

      const savedTransaction = await repo.save(transaction);

      logger.info(
        `[TransactionActionProvider.ts] ✅ Transaction saved | transactionId: ${savedTransaction.id}, bookingId: ${bookingId}`
      );

      return savedTransaction;
    } catch (error: any) {
      logger.error(
        `[TransactionActionProvider.ts] ❌ Failed to create transaction | bookingId: ${bookingId}, userId: ${userId}, error: ${error?.message}`,
        error
      );
      throw new CustomError(INTERNAL_ERROR_OCCURRED);
    }
  }

  // async createRefundTransaction(params: {
  //   userId: string;
  //   userRole: UserRole;
  //   bookingId: string;
  //   orignalAmount: number;
  //   refundAmount: number;
  //   refundReason: RefundReason;
  //   manager?: EntityManager;
  // }): Promise<Transaction> {
  //   const {
  //     userId,
  //     userRole,
  //     bookingId,
  //     manager,
  //     orignalAmount,
  //     refundAmount,
  //     refundReason,
  //   } = params;

  //   const em = manager || this.transactionActionRepository.manager;

  //   const transaction = await em.create(Transaction, {
  //     userId,
  //     userRole,
  //     bookingId,
  //     amount: refundAmount,
  //     type: TransactionType.REFUND,
  //     status: TransactionStatus.PENDING,
  //   });

  //   const savedTransaction = await em.save(transaction);

  //   await this.refundProvider.createRefund({
  // userId,
  // userRole,
  // bookingId,
  // orignalAmount,
  // refundAmount,
  // refundReason,
  // transactionId: savedTransaction.id,
  // manager,
  //   });

  //   return savedTransaction;
  // }
}
