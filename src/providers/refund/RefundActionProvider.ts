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

  async createRefund(
    params: {
      userId: string;
      userRole: UserRole;
      bookingId: string;
      originalAmount: number;
      refundAmount: number;
      refundReason: RefundReason;
      transactionId: string;
      manager?: EntityManager;
    } // Optional for now
  ): Promise<Refund> {
    // Step 1: Log refund action
    const {
      userId,
      bookingId,
      userRole,
      originalAmount,
      refundAmount,
      refundReason,
      transactionId,
      manager,
    } = params;
    logger.info(
      `💸 Refunding ₹${refundAmount} to user ${userId} for booking ${bookingId}`
    );

    const em = manager || this.refundRepository.manager;

    // Step 2: (MVP) Save refund details in DB
    const refund = await em.create(Refund, {
      userId,
      userRole,
      bookingId,
      originalAmount,
      transactionId,
      refundAmount,
      refundReason,
      transaction: { id: transactionId },
    });

    const savedRefund = await em.save(refund);

    // Step 3: (Future) Integrate with actual payment gateway
    // Example: await razorpay.refund(paymentReferenceId, amount);
    return savedRefund;
  }
}
