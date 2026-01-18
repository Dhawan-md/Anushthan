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

    // ✅ add this
    referenceKey: string;

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
      referenceKey,
      manager,
    } = params;

    if (!referenceKey) {
      throw new CustomError("Refund referenceKey is required.");
    }

    const em = manager || this.refundRepository.manager;

    logger.info(
      `[RefundActionProvider] 💸 Creating refund record for userId: ${userId}, bookingId: ${bookingId}, amount: ₹${refundAmount}, ref=${referenceKey}`
    );

    try {
      const repo = em.getRepository(Refund);

      // ✅ 1) Idempotency fast-path: if exists, return it (no duplicates)
      const existing = await repo.findOne({ where: { referenceKey } });
      if (existing) {
        logger.info(
          `✅ [RefundActionProvider] Refund already exists | refundId=${existing.id}, ref=${referenceKey}`
        );
        return existing;
      }

      // ✅ 2) Create
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
        referenceKey, // ✅ saved in DB
        transaction: { id: transactionId }, // keep your relation logic
      });

      const savedRefund = await repo.save(refund);

      logger.info(
        `✅ [RefundActionProvider] Refund record created | refundId=${savedRefund.id}, transactionId=${transactionId}, amount=₹${refundAmount}, ref=${referenceKey}`
      );

      return savedRefund;
    } catch (error: any) {
      // ✅ 3) Race-condition safe: unique violation means another request created it
      // Postgres unique violation code = 23505
      if (error?.code === "23505") {
        try {
          const repo = em.getRepository(Refund);
          const again = await repo.findOne({ where: { referenceKey } });
          if (again) {
            logger.info(
              `✅ [RefundActionProvider] Refund existed (race) | refundId=${again.id}, ref=${referenceKey}`
            );
            return again;
          }
        } catch (_) {
          // fallthrough to error below
        }
      }

      logger.error(
        `❌ [RefundActionProvider] Failed to create refund record for transactionId=${transactionId}, bookingId=${bookingId}, userId=${userId}, ref=${referenceKey}`,
        error
      );
      throw new CustomError("Failed to create refund. Please try again.");
    }
  }
}
