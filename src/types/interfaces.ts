// worker

import { RefundReason } from "../utils/enums";

export interface PaymentTimeoutJobData {
  transactionId: string;
  bookingId: string;
}

export interface RetryRefundJobData {
  userId: string;
  transactionId: string;
  paymentReferenceId: string;
  refundAmount: number;
  refundReason: RefundReason;
  bookingId: string;
  refundId?: string;
  attemptNumber: number;
  originalAmount: number;
}

export interface LocationSuggestion {
  description: string;
  latitude: number;
  longitude: number;
}
