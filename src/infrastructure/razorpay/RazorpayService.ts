import Razorpay from "razorpay";
import { Service } from "typedi";

import { env } from "../../config/env";
import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { RefundReason } from "../../utils/enums";

@Service()
export class RazorpayService {
  private razorpay: Razorpay | null = null;

  constructor() {
    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      logger.warn(
        "[RazorpayService.ts] ⚠️ Razorpay keys are not configured. Payment features will be unavailable."
      );
      return;
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    logger.info(
      "[RazorpayService.ts] 🔑 RazorpayService initialized with provided credentials."
    );
  }

  private ensureRazorpay() {
    if (!this.razorpay) {
      throw new CustomError("Razorpay is not configured. Please check environment variables.");
    }
    return this.razorpay;
  }

  async createRazorpayOrder(params: { amount: number; transactionId: string }) {
    const razorpay = this.ensureRazorpay();
    logger.info(
      `[RazorpayService.ts] 🧾 Creating Razorpay order for TransactionID=${params.transactionId}, Amount=${params.amount} INR`
    );

    try {
      const response = await razorpay.orders.create({
        amount: params.amount * 100, // amount in paisa
        currency: "INR",
        receipt: `txn_${params.transactionId}`,
        notes: {
          transactionId: params.transactionId,
        },
      });

      logger.info(
        `[RazorpayService.ts] ✅ Razorpay order created successfully | OrderID=${response.id}, TransactionID=${params.transactionId}`
      );
      return response;
    } catch (error: any) {
      logger.error(
        `[RazorpayService.ts] ❌ Failed to create Razorpay order for TransactionID=${params.transactionId}: ${error?.message}`,
        error
      );

      throw new CustomError(
        "Something went wrong while creating Razorpay order. Please try again later."
      );
    }
  }

  async fetchPayment(orderId: string) {
    const razorpay = this.ensureRazorpay();
    logger.info(
      `[RazorpayService.ts] 🔍 Fetching Razorpay payment details | PaymentID=${orderId}`
    );

    try {
      const payment = await razorpay.payments.fetch(orderId);

      logger.info(
        `[RazorpayService.ts] ✅ Payment fetched successfully | PaymentID=${orderId}, Status=${payment.status}`
      );
      return payment;
    } catch (error: any) {
      logger.error(
        `[RazorpayService.ts] ❌ Failed to fetch Razorpay payment | PaymentID=${orderId}, Error: ${error?.message}`,
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

    const razorpay = this.ensureRazorpay();
    logger.info(
      `[RazorpayService.ts] 💸 Initiating refund | TransactionID=${transactionId}, PaymentID=${paymentReferenceId}, RefundID=${refundId}, Amount=${refundAmount} INR, Reason=${refundReason}`
    );

    try {
      const refundResponse = await razorpay.payments.refund(
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
        `[RazorpayService.ts] ✅ Refund created successful | RefundID=${refundResponse.id}, TransactionID=${transactionId}`
      );

      return refundResponse;
    } catch (error: any) {
      logger.error(
        `[RazorpayService.ts] ❌ Failed to refund payment: PaymentID=${paymentReferenceId}, TransactionID=${transactionId}, Error=${error?.message}`,
        error
      );
      throw new CustomError(
        "Refund failed. Please try again or contact support."
      );
    }
  }
}
