import { Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { Refund } from "../../entities/Refund";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";
import { RefundReason, UserRole } from "../../utils/enums";
import { CustomError } from "../../utils/customError";

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
    attemptNumber: number;
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
      attemptNumber,
      manager,
    } = params;

    const em = manager || this.refundRepository.manager;

    logger.info(
      `[RefundActionProvider] 💸 Creating refund record for userId: ${userId}, bookingId: ${bookingId}, amount: ₹${refundAmount}`
    );

    try {
      const repo = em.getRepository(Refund);
      const refund = repo.create({
        userId,
        userRole,
        bookingId,
        originalAmount,
        refundAmount,
        refundReason,
        transactionId,
        paymentReferenceId,
        attemptNumber,
        transaction: { id: transactionId }, // for relation
      });

      const savedRefund = await repo.save(refund);

      logger.info(
        `✅ [RefundActionProvider] Refund record created | refundId=${savedRefund.id}, transactionId=${transactionId}, amount=₹${refundAmount}`
      );

      return savedRefund;
    } catch (error: any) {
      logger.error(
        `❌ [RefundActionProvider] Failed to create refund record for transactionId=${transactionId}, bookingId=${bookingId}, userId=${userId}`,
        error
      );
      throw new CustomError("Failed to create refund. Please try again.");
    }
  }
}
