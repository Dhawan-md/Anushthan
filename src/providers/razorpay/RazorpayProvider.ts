import Razorpay from "razorpay";
import { Service } from "typedi";
import { RefundReason } from "../../utils/enums";

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
    const response = await this.razorpay.orders.create({
      amount: params.amount * 100,
      currency: "INR",
      receipt: "txn_" + params.transactionId,
      notes: {
        transactionId: params.transactionId,
      },
    });
    return response;
  }

  async fetchPayment(paymentId: string) {
    return await this.razorpay.payments.fetch(paymentId);
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
