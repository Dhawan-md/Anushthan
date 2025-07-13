import Razorpay from "razorpay";
import { Service } from "typedi";

import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { RefundReason } from "../../utils/enums";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new CustomError("Razorpay keys are not configured in environment.");
}

@Service()
export class RazorpayProvider {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    logger.info(
      "[RazorpayProvider.ts] 🔑 RazorpayProvider initialized with provided credentials."
    );
  }

  async createRazorpayOrder(params: { amount: number; transactionId: string }) {
    logger.info(
      `[RazorpayProvider.ts] 🧾 Creating Razorpay order for TransactionID=${params.transactionId}, Amount=${params.amount} INR`
    );

    try {
      const response = await this.razorpay.orders.create({
        amount: params.amount * 100, // amount in paisa
        currency: "INR",
        receipt: `txn_${params.transactionId}`,
        notes: {
          transactionId: params.transactionId,
        },
      });

      logger.info(
        `[RazorpayProvider.ts] ✅ Razorpay order created successfully | OrderID=${response.id}, TransactionID=${params.transactionId}`
      );
      return response;
    } catch (error: any) {
      logger.error(
        `[RazorpayProvider.ts] ❌ Failed to create Razorpay order for TransactionID=${params.transactionId}: ${error?.message}`,
        error
      );

      throw new CustomError(
        "Something went wrong while creating Razorpay order. Please try again later."
      );
    }
  }

  async fetchPayment(orderId: string) {
    logger.info(
      `[RazorpayProvider.ts] 🔍 Fetching Razorpay payment details | PaymentID=${orderId}`
    );

    try {
      const payment = await this.razorpay.payments.fetch(orderId);

      logger.info(
        `[RazorpayProvider.ts] ✅ Payment fetched successfully | PaymentID=${orderId}, Status=${payment.status}`
      );
      return payment;
    } catch (error: any) {
      logger.error(
        `[RazorpayProvider.ts] ❌ Failed to fetch Razorpay payment | PaymentID=${orderId}, Error: ${error?.message}`,
        error
      );
      throw new CustomError(
        "Failed to fetch payment details. Please try again."
      );
    }
  }

  async refundPayment(params: {
    transactionId: string;
    paymentReferenceId: string; // Razorpay payment_id
    refundAmount: number; // in rupees
    refundReason: RefundReason;
    bookingId: string;
    refundId: string;
  }) {
    const {
      transactionId,
      paymentReferenceId,
      refundAmount,
      refundReason,
      refundId,
    } = params;

    logger.info(
      `[RazorpayProvider.ts] 💸 Initiating refund | TransactionID=${transactionId}, PaymentID=${paymentReferenceId}, RefundID=${refundId}, Amount=${refundAmount} INR, Reason=${refundReason}`
    );

    try {
      const refundResponse = await this.razorpay.payments.refund(
        paymentReferenceId,
        {
          amount: Math.round(refundAmount * 100), // Razorpay expects paise
          notes: {
            reason: refundReason,
            transactionId,
            refundId,
          },
        }
      );

      logger.info(
        `[RazorpayProvider.ts] ✅ Refund created successful | RefundID=${refundResponse.id}, TransactionID=${transactionId}`
      );

      return refundResponse;
    } catch (error: any) {
      logger.error(
        `[RazorpayProvider.ts] ❌ Failed to refund payment: PaymentID=${paymentReferenceId}, TransactionID=${transactionId}, Error=${error?.message}`,
        error
      );
      throw new CustomError(
        "Refund failed. Please try again or contact support."
      );
    }
  }
}
