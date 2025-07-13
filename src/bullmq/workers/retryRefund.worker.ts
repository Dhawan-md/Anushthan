import { Container } from "typedi";
import { Job } from "bullmq";

import { RefundActionProvider } from "../../providers/refund/RefundActionProvider";
import { RazorpayProvider } from "../../providers/razorpay/RazorpayProvider";

import { createBullWorker } from "../../config/bullmq";
import { AppDataSource } from "../../config/database";

import { UserRole } from "../../utils/enums";
import { logger } from "../../utils/logger";
import { RetryRefundJobData } from "../../types/interfaces";

const startWorker = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("[retryRefund-worker] 📦 Data source initialized in worker.");
    }

    createBullWorker("retryRefund", async (job: Job<RetryRefundJobData>) => {
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
          `[retryRefund-worker] 🚀 Starting refund attempt #${attemptNumber} for transaction ${transactionId}, refundId: ${refundId}`
        );

        // If retry, create a new refund entry
        if (!actualRefundId || attemptNumber > 1) {
          logger.info(
            `[retryRefund-worker] 🆕 Creating new refund entry for retry attempt #${attemptNumber}`
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

          logger.info(
            `[retryRefund-worker] 🆕 New refund entry created with ID: ${actualRefundId}`
          );
        }

        const order = await razorpayProvider.refundPayment({
          transactionId,
          paymentReferenceId,
          refundAmount,
          refundReason,
          bookingId,
          refundId: actualRefundId,
        });

        logger.info(
          `[retryRefund-worker] ✅ Successfully initiated Razorpay refund: ${JSON.stringify(
            order
          )}`
        );
      } catch (error: any) {
        logger.error(
          `[retryRefund-worker] ❌ Refund attempt #${attemptNumber} failed for refundId ${refundId}`,
          {
            error: error.message,
            stack: error.stack,
          }
        );

        throw error;
      }
    });
  } catch (err) {
    logger.error(
      "[retryRefund-worker] ❌ Worker failed to start due to DB init error",
      {
        error: err,
      }
    );
  }
};

startWorker();
