import express from "express";
import crypto from "crypto";
import Container from "typedi";

import { PaymentWebhookService } from "../../services/payment/PaymentWebhookService";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { INTERNAL_ERROR_OCCURRED } from "../../utils/messages";

const RAZORPAY_WEBHOOK_SECRET = env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_WEBHOOK_SECRET) {
  logger.warn(
    "⚠️ RAZORPAY_KEY_SECRET is not set in environment variables. Webhook signature verification will fail."
  );
}

export const razorpayWebhookHandler = async (
  req: express.Request,
  res: express.Response
) => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    logger.error("❌ RAZORPAY_KEY_SECRET is missing. Cannot verify webhook signature.");
    throw new CustomError("RAZORPAY_KEY_SECRET is not set");
  }

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

  const paymentWebhookService = Container.get(PaymentWebhookService);

  try {
    switch (payload.event) {
      case "order.paid":
        await paymentWebhookService.handleOrderPaid(payload);
        break;

      case "payment.failed":
        await paymentWebhookService.handlePaymentFailed(payload);
        break;

      case "refund.processed":
        await paymentWebhookService.handleRefundProcessed(payload);
        break;

      case "refund.failed":
        await paymentWebhookService.handleRefundFailed(payload);
        break;

      default:
        logger.warn(`⚠️ Unhandled event type: ${payload.event}`);
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error("❌ Error processing webhook:", err);
    throw new CustomError(INTERNAL_ERROR_OCCURRED);
  }
};
