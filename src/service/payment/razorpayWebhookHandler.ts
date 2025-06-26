import express from "express";
import crypto from "crypto";
import Container from "typedi";
import { UpdateTransactionProvider } from "../../providers/transaction/UpdateTransactionProvider";
import { RefundStatus, TransactionStatus } from "../../utils/enums";
import { UpdateRefundProvider } from "../../providers/refund/UpdateRefundProvider";
import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { INTERNAL_ERROR_OCCURRED } from "../../utils/messages";
import { AppDataSource } from "../../config/database";
import { UpdateBookingProvider } from "../../providers/booking/UpdateBookingProvider";

const RAZORPAY_WEBHOOK_SECRET = process.env["RAZORPAY_KEY_SECRET"];

if (!RAZORPAY_WEBHOOK_SECRET) {
  throw new Error("RAZORPAY_KEY_SECRET is not set in environment variables");
}

export const razorpayWebhookHandler = async (
  req: express.Request,
  res: express.Response
) => {
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

  try {
    switch (payload.event) {
      case "order.paid": {
        const paymentEntity = payload.payload.payment.entity;
        const paymentId = paymentEntity.id;
        const orderId = paymentEntity.order_id;
        const transactionId =
          payload.payload.payment.entity.notes.transactionId;

        if (!orderId) {
          logger.error("❌ Missing transactionId in notes");
          return res
            .status(400)
            .json({ error: "Missing transactionId in notes" });
        }

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
              throw new Error("Missing Booking ID on Transaction entity");
            }

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

        break;
      }

      case "payment.failed": {
        const paymentEntity = payload.payload.payment.entity;
        const orderId = paymentEntity.order_id;
        const reason =
          paymentEntity.error_description || paymentEntity.error_reason;
        const paymentId = paymentEntity.id;

        const transactionId = paymentEntity.notes?.transactionId;
        console.log(paymentEntity);

        logger.warn(
          `❌ Payment failed for Order ID: ${orderId} | Reason: ${reason}`
        );

        if (!transactionId) {
          logger.error("❌ Missing transactionId in payment.notes");
          return res.status(400).json({ error: "Missing transactionId" });
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
        const refundData = payload.payload.refund.entity;
        const refundReferenceId = refundData.id;
        const paymentId = refundData.payment_id;
        const refundNotes = refundData.notes;

        if (!refundNotes?.refundId) {
          logger.error("❌ Missing refundId in notes");
        }

        await AppDataSource.manager.transaction(
          async (transactionalEntityManager) => {
            const refund = await updateRefundProvider.updateRefund({
              updatedRefundData: {
                status: RefundStatus.SUCCESS,
                refundedAt: new Date(),
                refundReferenceId,
              },
              refundId: refundNotes.refundId,
              paymentReferenceId: paymentId,
              manager: transactionalEntityManager, // pass manager to updateRefund
            });

            if (!refund?.data?.transactionId) {
              logger.error("❌ Missing transactionId on refund entity");
              throw new Error("Missing transactionId on refund");
            }

            await updateTransactionProvider.updateTransaction({
              updatedTransactionData: {
                isRefunded: true,
              },
              transactionId: refund.data.transactionId,
              manager: transactionalEntityManager, // pass manager to updateTransaction
            });

            logger.info("✅ Refund and transaction updated to SUCCESS!");
          }
        );

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
