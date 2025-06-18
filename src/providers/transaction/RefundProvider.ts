import { Service } from "typedi";
import { Repository } from "typeorm";
import { Refund } from "../../entities/Refund";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";

@Service()
export class RefundProvider {
  private refundRepository: Repository<Refund>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.refundRepository = this.repositoryFactory.getRepository(Refund);
  }
  async refundUser(
    userId: string,
    refundAmount: number,
    bookingId: string,
    paymentReferenceId?: string // Optional for now
  ): Promise<void> {
    // Step 1: Log refund action
    logger.info(
      `💸 Refunding ₹${refundAmount} to user ${userId} for booking ${bookingId}`
    );

    // Step 2: (MVP) Save refund details in DB
    const refund = this.refundRepository.create({
      userId,
      bookingId,
      refundAmount,
      paymentReferenceId,

    });

    await this.refundRepository.save(refund);

    // Step 3: (Future) Integrate with actual payment gateway
    // Example: await razorpay.refund(paymentReferenceId, amount);
  }
}
