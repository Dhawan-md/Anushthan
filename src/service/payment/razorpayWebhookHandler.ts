import express from "express";
import crypto from "crypto";
import Container from "typedi";

import { UpdateTransactionProvider } from "../../providers/transaction/UpdateTransactionProvider";
import { UpdateBookingProvider } from "../../providers/booking/UpdateBookingProvider";
import { UpdateRefundProvider } from "../../providers/refund/UpdateRefundProvider";

import { AppDataSource } from "../../config/database";

import { retryRefundQueue } from "../../bullmq/queues/retryRefund.queue";

import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";

import { INTERNAL_ERROR_OCCURRED } from "../../utils/messages";
import { MAX_ATTEMPTS } from "../../utils/constants";
import { RefundStatus, TransactionStatus } from "../../utils/enums";
import { UserLocationProvider } from "../../providers/user/UserLocationProvider";
import { NotificationProvider } from "../../providers/notification/notificationProvider";

const RAZORPAY_WEBHOOK_SECRET = process.env["RAZORPAY_KEY_SECRET"];

if (!RAZORPAY_WEBHOOK_SECRET) {
  throw new CustomError(
    "RAZORPAY_KEY_SECRET is not set in environment variables"
  );
}

export const razorpayWebhookHandler = async (
  req: express.Request,
  res: express.Response
) => {
  logger.info("📬 Webhook endpoint hit");
  let payload: any;

  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch (err) {
    logger.error("❌ Failed to parse webhook body:", err);
    throw new CustomError("Invalid Json");
  }

  const signature = req.headers["x-razorpay-signature"] as string;
  logger.info("📨 Incoming webhook:", JSON.stringify(payload, null, 2));

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (signature !== expectedSignature) {
    logger.warn("❌ Invalid signature!");
    throw new CustomError("Invalid signature!");
  }

  const updateTransactionProvider = Container.get(UpdateTransactionProvider);
  const updateRefundProvider = Container.get(UpdateRefundProvider);
  const updateBookingProvider = Container.get(UpdateBookingProvider);
  const userLocationProvider = Container.get(UserLocationProvider);
  const notificationProvider = Container.get(NotificationProvider);

  try {
    switch (payload.event) {
      case "order.paid": {
        const paymentEntity = payload.payload.payment.entity;
        const paymentId = paymentEntity.id;
        const orderId = paymentEntity.order_id;
        const transactionId = paymentEntity.notes.transactionId;

        if (!transactionId) {
          logger.error("❌ Missing transactionId in notes");
        }

        let bookingUserId: string | null = null;

        await AppDataSource.manager.transaction(
          async (transactionalEntityManager) => {
            const transaction =
              await updateTransactionProvider.updateTransaction({
                updatedTransactionData: {
                  status: TransactionStatus.SUCCESS,
                  paymentReferenceId: paymentId,
                  paymentMethod: paymentEntity.method,
                },
                orderId,
                transactionId,
                manager: transactionalEntityManager,
              });

            if (!transaction.data?.bookingId) {
              logger.error("❌ Missing Booking ID on Transaction entity");
              throw new CustomError("Missing Booking ID on Transaction entity");
            }

            bookingUserId = transaction.data.userId;

            await updateBookingProvider.updateBooking({
              updatedBookingData: {
                paid: true,
              },
              bookingId: transaction.data.bookingId,
              manager: transactionalEntityManager,
            });

            logger.info("✅ Booking and transaction updated to SUCCESS!");
          }
        );

        if (bookingUserId) {
          const nearByPandits = await userLocationProvider.findNearbyPandits(
            bookingUserId
          );

          await notificationProvider.publish(
            "booking_notification",
            "BOOKING_ACCEPTED",
            {
              senderUserId: bookingUserId,
              message: `You have a new booking.`,
              receiverFcmTokens: nearByPandits,
            }
          );
        }

        break;
      }

      case "payment.failed": {
        const paymentEntity = payload.payload.payment.entity;
        const orderId = paymentEntity.order_id;
        const reason =
          paymentEntity.error_description || paymentEntity.error_reason;
        const paymentId = paymentEntity.id;
        const transactionId = paymentEntity.notes?.transactionId;

        logger.warn(
          `❌ Payment failed for Order ID: ${orderId} | Reason: ${reason}`
        );

        if (!transactionId) {
          logger.error("❌ Missing transactionId in payment.notes");
        }

        await updateTransactionProvider.updateTransaction({
          transactionId,
          orderId,
          updatedTransactionData: {
            status: TransactionStatus.FAILED,
            paymentMethod: paymentEntity.method,
            paymentReferenceId: paymentId,
          },
        });

        logger.info(`🚫 Marked transaction ${transactionId} as FAILED`);
        break;
      }

      case "refund.processed": {
        const refundEntity = payload.payload.refund.entity;
        const refundReferenceId = refundEntity.id;
        const paymentId = refundEntity.payment_id;
        const refundNotes = refundEntity.notes;

        if (!refundNotes?.refundId) {
          logger.error("❌ Missing refundId in notes");
        }

        await AppDataSource.manager.transaction(
          async (transactionalEntityManager) => {
            const refundData = await updateRefundProvider.updateRefund({
              updatedRefundData: {
                status: RefundStatus.SUCCESS,
                refundedAt: new Date(),
                refundReferenceId,
              },
              refundId: refundNotes.refundId,
              paymentReferenceId: paymentId,
              manager: transactionalEntityManager, // pass manager to updateRefund
            });

            if (!refundData?.data?.transactionId) {
              logger.error("❌ Missing transactionId on refund entity");
              throw new CustomError("Missing transactionId on refund");
            }

            await updateTransactionProvider.updateTransaction({
              updatedTransactionData: {
                isRefunded: true,
              },
              transactionId: refundData.data.transactionId,
              manager: transactionalEntityManager, // pass manager to updateTransaction
            });

            logger.info("✅ Refund and transaction updated to SUCCESS!");
          }
        );

        break;
      }

      case "refund.failed": {
        const refundEntity = payload.payload.refund.entity;
        const paymentId = refundEntity.payment_id;
        const refundNotes = refundEntity.notes;

        logger.error(
          `❌ Razorpay refund failed for paymentId: ${paymentId}, reason: ${
            refundEntity.error_description || "Unknown"
          }`
        );

        const refundData = await updateRefundProvider.updateRefund({
          updatedRefundData: {
            status: RefundStatus.FAILED,
            failedReason: refundEntity.error_description || "Unknown",
          },
          refundId: refundNotes.refundId,
          paymentReferenceId: paymentId,
        });

        if (!refundData.data) {
          logger.error(
            `❌ Refund record not found or update failed for refundId: ${refundNotes.refundId}`
          );
          throw new CustomError("Unexpected error occurred while refunding.");
        }

        const attempt = refundData.data.attemptNumber;

        if (attempt < MAX_ATTEMPTS) {
          const nextAttempt = attempt + 1;
          const delay = Math.pow(2, nextAttempt) * 60 * 1000;

          logger.info(
            `🔁 Scheduling retry attempt #${nextAttempt} for refundId: ${
              refundData.data.id
            } with delay: ${delay / 1000}s`
          );

          await retryRefundQueue.add(
            "retry-refund",
            {
              userId: refundData.data.userId,
              transactionId: refundData.data.transactionId,
              paymentReferenceId: refundData.data.paymentReferenceId,
              refundAmount: refundData.data.refundAmount,
              refundReason: refundData.data.refundReason,
              bookingId: refundData.data.bookingId,
              refundId: refundData.data.id,
              attemptNumber: nextAttempt,
              originalAmount: refundData.data.originalAmount,
            },
            { delay }
          );
        } else {
          logger.warn(
            `🚫 Max refund attempts reached for refundId: ${refundData.data.id}`
          );
        }

        break;
      }

      default: {
        logger.warn(`⚠️ Unhandled event type: ${payload.event}`);
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error("❌ Error processing webhook:", err);
    throw new CustomError(INTERNAL_ERROR_OCCURRED);
  }
};
