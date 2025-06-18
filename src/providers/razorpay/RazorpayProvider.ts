import Razorpay from "razorpay";
import { Service } from "typedi";

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

  async refundPayment(paymentId: string, amount?: number) {
    return await this.razorpay.payments.refund(paymentId, {
      amount: amount, // If undefined, full refund
    });
  }
}
