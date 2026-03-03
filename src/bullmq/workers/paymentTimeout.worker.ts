import Container from "typedi";
import { Job } from "bullmq";

import { UpdateBookingService } from "../../services/booking/UpdateBookingService";
import { UpdateTransactionService } from "../../services/transaction/UpdateTransactionService";
import { TransactionInfoService } from "../../services/transaction/TransactionInfoService";

import { AppDataSource } from "../../config/database";
import { createBullWorker } from "../../config/bullmq";

import { logger } from "../../utils/logger";
import { PaymentTimeoutJobData } from "../../types/interfaces";
import { BookingStatus, TransactionStatus } from "../../utils/enums";

const startWorker = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info(
        `[paymentTimeout-worker] 📦 Data source initialized in worker.`
      );
    }

    createBullWorker(
      "paymentTimeout",
      async (job: Job<PaymentTimeoutJobData>) => {
        try {
          const { transactionId, bookingId } = job.data;
          logger.info(`[paymentTimeout-worker] 🔁 Processing delayed payment`, {
            bookingId,
            transactionId,
            jobId: job.id,
          });

          const transactionInfoService = Container.get(
            TransactionInfoService
          );
          const updateBookingService = Container.get(UpdateBookingService);
          const updateTransactionService = Container.get(
            UpdateTransactionService
          );

          await AppDataSource.manager.transaction(
            async (transactionalEntityManager) => {
              const transaction = await transactionInfoService.getTransaction({
                transactionId,
              });

              switch (transaction.status) {
                case TransactionStatus.PENDING: {
                  await updateTransactionService.updateTransaction({
                    transactionId,
                    updatedTransactionData: {
                      status: TransactionStatus.FAILED,
                    },
                    manager: transactionalEntityManager,
                  });

                  await updateBookingService.updateBooking({
                    bookingId,
                    updatedBookingData: { status: BookingStatus.REJECTED },
                    manager: transactionalEntityManager,
                  });

                  logger.info(
                    `[paymentTimeout-worker] 🚫 Booking ${bookingId} marked as REJECTED due to payment timeout.`
                  );
                  logger.info(
                    `[paymentTimeout-worker] 🚫 Transaction ${transactionId} marked as FAILED due to payment timeout.`
                  );
                  break;
                }

                case TransactionStatus.FAILED: {
                  await updateBookingService.updateBooking({
                    bookingId,
                    updatedBookingData: { status: BookingStatus.REJECTED },
                    manager: transactionalEntityManager,
                  });

                  logger.info(
                    `[paymentTimeout-worker] 🚫 Booking ${bookingId} marked as REJECTED due to already FAILED transaction.`
                  );
                  break;
                }

                case TransactionStatus.SUCCESS: {
                  await updateBookingService.updateBooking({
                    bookingId,
                    updatedBookingData: { paid: true },
                    manager: transactionalEntityManager,
                  });

                  logger.info(
                    `[paymentTimeout-worker] ✅ Booking ${bookingId} marked as paid (transaction successful).`
                  );
                  break;
                }

                default: {
                  logger.warn(
                    `[paymentTimeout-worker] ⚠️ Unhandled transaction status '${transaction.status}' for booking ${bookingId}, transaction ${transactionId}`
                  );
                  break;
                }
              }
            }
          );

          logger.info(
            `[paymentTimeout-worker] ✅ Job complete for booking ${bookingId}`
          );
        } catch (error) {
          logger.error(
            "[paymentTimeout-worker] ❌ Error in BullMQ worker for paymentTimeout",
            { error }
          );
          throw error;
        }
      }
    );
  } catch (err) {
    logger.error(
      "[paymentTimeout-worker] ❌ Worker failed to start due to DB init error",
      { error: err }
    );
  }
};

startWorker(); // ⬅️ Bootstraps the worker
