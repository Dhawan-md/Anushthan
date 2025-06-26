import { Service } from "typedi";
import { EntityManager, Repository } from "typeorm";
import { Transaction } from "../../entities/Transaction";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import {
  TransactionStatus,
  TransactionType,
  UserRole,
} from "../../utils/enums";
import { logger } from "../../utils/logger";

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
    logger.info(`🔄 Creating transaction with booking ID: ${bookingId}`);

    const em = manager || this.transactionActionRepository.manager;
    console.log("errrrr");
    
    const transaction = await em.create(Transaction, {
      userId,
      userRole,
      bookingId,
      amount,
      type,
      status: TransactionStatus.PENDING,
      booking: { id: bookingId },
    });

    return em.save(Transaction, transaction);
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
