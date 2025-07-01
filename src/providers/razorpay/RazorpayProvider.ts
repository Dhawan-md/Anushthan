import Razorpay from "razorpay";
import { Service } from "typedi";
import { RefundReason } from "../../utils/enums";
import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";

@Service()
export class RazorpayProvider {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createRazorpayOrder(params: {
    amount: number;
    transactionId: string;
    userId: string;
  }) {
    try {
      const response = await this.razorpay.orders.create({
        amount: params.amount * 100, // amount in paisa
        currency: "INR",
        receipt: `txn_${params.transactionId}`,
        notes: {
          transactionId: params.transactionId,
          userId: params.userId,
        },
      });

      logger.info(
        `✅ Razorpay order created: OrderID=${response.id} for TransactionID=${params.transactionId}`
      );

      return response;
    } catch (error: any) {
      logger.error(
        `❌ Failed to create Razorpay order for TransactionID=${params.transactionId}: ${error?.message}`,
        error
      );

      // Optional: Wrap Razorpay error into your custom error class
      throw new CustomError(
        "Something went wrong while creating Razorpay order. Please try again later."
      );
    }
  }

  async fetchPayment(orderId: string) {
    return await this.razorpay.payments.fetch(orderId);
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

    return refundResponse;
  }
}
