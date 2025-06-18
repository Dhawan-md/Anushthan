import express from "express";
import crypto from "crypto";
import Container from "typedi";
import { UpdateTransactionProvider } from "../../providers/transaction/UpdateTransactionProvider";
import { TransactionStatus } from "../../utils/enums";

const RAZORPAY_WEBHOOK_SECRET = process.env["RAZORPAY_KEY_SECRET"]; // You will set this in Razorpay dashboard when configuring webhook

if (!RAZORPAY_WEBHOOK_SECRET) {
  throw new Error("RAZORPAY_KEY_SECRET is not set in environment variables");
}

export const razorpayWebhookHandler = async (
  req: express.Request,
  res: express.Response
) => {
  const payload = JSON.parse(req.body.toString("utf8"));
  const signature = req.headers["x-razorpay-signature"] as string;

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (signature === expectedSignature) {
    console.log("✅ Webhook verified: ", payload);

    // Example: If payment was successful → update transaction
    if (payload.event === "order.paid") {
      const paymentId = payload.payload.payment.entity.id;
      const orderId = payload.payload.payment.entity.order_id;
      const transactionId = payload.payload.payment.entity.notes;

      console.log(
        "Payment captured! Payment ID:",
        paymentId,
        "Order ID:",
        orderId,
        transactionId
      );

      try {
        const updateTransactionProvider = Container.get(
          UpdateTransactionProvider
        );

        await updateTransactionProvider.updateTransaction({
          updatedTransactionData: {
            status: TransactionStatus.SUCCESS,
            paymentReferenceId: paymentId, // Save Razorpay paymentId
          },
          orderId,
        });

        console.log("✅ Transaction updated successfully!");
      } catch (err) {
        console.error("❌ Failed to update transaction:", err);
        return res.status(500).json({ error: "Failed to update transaction" });
      }
    }

    res.status(200).json({ received: true });
  } else {
    console.warn("❌ Invalid signature!");
    res.status(400).send("Invalid signature");
  }
};
