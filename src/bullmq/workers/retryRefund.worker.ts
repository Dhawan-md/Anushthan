import { Container } from "typedi";
import { createBullWorker } from "../../config/bullmq";
import { RefundActionProvider } from "../../providers/refund/RefundActionProvider";
import { UserRole } from "../../utils/enums";
import { RazorpayProvider } from "../../providers/razorpay/RazorpayProvider";
import { logger } from "../../utils/logger";
import { AppDataSource } from "../../config/database";

const startWorker = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("📦 Data source initialized in worker.");
    }

    createBullWorker("retryRefund", async (job) => {
      const {
        userId,
        transactionId,
        paymentReferenceId,
        refundAmount,
        refundReason,
        bookingId,
        refundId,
        attemptNumber,
        originalAmount,
      } = job.data;

      const refundActionProvider = Container.get(RefundActionProvider);
      const razorpayProvider = Container.get(RazorpayProvider);

      try {
        let actualRefundId = refundId;

        logger.info(
          `🚀 Starting refund attempt #${attemptNumber} for transaction ${transactionId}, refundId: ${refundId}`
        );

        // If retry, create a new refund entry
        if (attemptNumber > 1) {
          logger.info(
            `🆕 Creating new refund entry for retry attempt #${attemptNumber}`
          );

          const newRefund = await refundActionProvider.createRefund({
            userId,
            userRole: UserRole.USER,
            transactionId,
            bookingId,
            originalAmount,
            refundAmount,
            refundReason,
            paymentReferenceId,
            attemptNumber,
          });

          actualRefundId = newRefund.id;

          logger.info(`🆕 New refund created with ID: ${actualRefundId}`);
        }

        const order = await razorpayProvider.refundPayment({
          transactionId,
          paymentReferenceId,
          refundAmount,
          refundReason,
          bookingId,
          refundId: actualRefundId,
        });
        console.log(order);
        
        logger.info(
          `✅ Successfully initiated Razorpay refund: ${JSON.stringify(order)}`
        );

        // Optionally update refund status here (if needed in this phase)
      } catch (error: any) {
        logger.error(
          `❌ Refund attempt #${attemptNumber} failed for refundId ${refundId}`,
          {
            error: error.message,
            stack: error.stack,
          }
        );

        throw error; // Let BullMQ handle retry policies
      }
    });
  } catch (err) {
    logger.error("❌ Worker failed to start due to DB init error", {
      error: err,
    });
  }
};

startWorker();
