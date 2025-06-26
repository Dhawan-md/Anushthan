import { Service } from "typedi";
import { EntityManager, Repository } from "typeorm";
import { Refund } from "../../entities/Refund";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";
import { RefundReason, UserRole } from "../../utils/enums";

@Service()
export class RefundActionProvider {
  private refundRepository: Repository<Refund>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.refundRepository = this.repositoryFactory.getRepository(Refund);
  }

  async createRefund(params: {
    userId: string;
    userRole: UserRole;
    bookingId: string;
    originalAmount: number;
    refundAmount: number;
    refundReason: RefundReason;
    transactionId: string;
    paymentReferenceId: string;
    manager?: EntityManager;
  }): Promise<Refund> {
    const {
      userId,
      userRole,
      bookingId,
      originalAmount,
      refundAmount,
      refundReason,
      transactionId,
      paymentReferenceId,
      manager,
    } = params;

    const em = manager || this.refundRepository.manager;

    logger.info(
      `💸 Creating refund record for userId: ${userId}, bookingId: ${bookingId}, amount: ₹${refundAmount}`
    );

    const refund = em.create(Refund, {
      userId,
      userRole,
      bookingId,
      originalAmount,
      refundAmount,
      refundReason,
      transactionId,
      paymentReferenceId,
      transaction: { id: transactionId }, // Ensures .transaction works for later eager loads
    });

    const savedRefund = await em.save(refund);

    logger.info(
      `✅ Refund record created: refundId: ${savedRefund.id}, linked to transactionId: ${transactionId}`
    );

    return savedRefund;
  }
}
