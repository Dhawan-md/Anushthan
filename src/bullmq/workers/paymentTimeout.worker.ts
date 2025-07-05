import Container from "typedi";
import { AppDataSource } from "../../config/database";
import { createBullWorker } from "../../config/bullmq";
import { BookingInfoProvider } from "../../providers/booking/BookingInfoProvider";
import { logger } from "../../utils/logger";
import { UpdateBookingProvider } from "../../providers/booking/UpdateBookingProvider";
import { UpdateTransactionProvider } from "../../providers/transaction/UpdateTransactionProvider";
import { TransactionInfoProvider } from "../../providers/transaction/TransactionInfoProvider";
import { BookingStatus, TransactionStatus } from "../../utils/enums";

const startWorker = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("📦 Data source initialized in worker.");
    }

    createBullWorker("paymentTimeout", async (job) => {
      try {
        const { transactionId, bookingId } = job.data;
        logger.info(
          `🔁 Processing delayed payment failure for booking ${bookingId} and transaction ${transactionId}`
        );

        const bookingInfoProvider = Container.get(BookingInfoProvider);
        const transactionInfoProvider = Container.get(TransactionInfoProvider);
        const updateBookingProvider = Container.get(UpdateBookingProvider);
        const updateTransactionProvider = Container.get(
          UpdateTransactionProvider
        );

        await AppDataSource.manager.transaction(
          async (transactionalEntityManager) => {
            const booking = await bookingInfoProvider.getBookingDetails({
              bookingId,
            });
            const transaction = await transactionInfoProvider.getTransaction({
              transactionId,
            });

            if (transaction.status === TransactionStatus.PENDING) {
              await updateTransactionProvider.updateTransaction({
                transactionId,
                updatedTransactionData: { status: TransactionStatus.FAILED },
                manager: transactionalEntityManager,
              });
            }

            if (booking.status === BookingStatus.PENDING && !booking.paid) {
              await updateBookingProvider.updateBooking({
                bookingId,
                updatedBookingData: { status: BookingStatus.REJECTED },
                manager: transactionalEntityManager,
              });

              logger.info(
                `🚫 Booking ${bookingId} marked as REJECTED due to payment timeout.`
              );
            } else {
              logger.info(
                `✅ Booking ${bookingId} already paid or processed, skipping rejection.`
              );
            }
          }
        );
      } catch (error) {
        logger.error("❌ Error in BullMQ worker for paymentTimeout", { error });
        throw error;
      }
    });
  } catch (err) {
    logger.error("❌ Worker failed to start due to DB init error", {
      error: err,
    });
  }
};

startWorker(); // ⬅️ Bootstraps the worker
