import { Inject, Service } from "typedi";
import { UpdateTransactionService } from "../transaction/UpdateTransactionService";
import { UpdateBookingService } from "../booking/UpdateBookingService";
import { UpdateRefundService } from "../refund/UpdateRefundService";
import { UserLocationService } from "../user/UserLocationService";
import { NotificationService } from "../notification/NotificationService";
import { AppDataSource } from "../../config/database";
import { retryRefundQueue } from "../../bullmq/queues/retryRefund.queue";
import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { MAX_ATTEMPTS } from "../../utils/constants";
import { RefundStatus, TransactionStatus } from "../../utils/enums";

@Service()
export class PaymentWebhookService {
    constructor(
        @Inject(() => UpdateTransactionService)
        private updateTransactionService: UpdateTransactionService,
        @Inject(() => UpdateRefundService)
        private updateRefundService: UpdateRefundService,
        @Inject(() => UpdateBookingService)
        private updateBookingService: UpdateBookingService,
        @Inject(() => UserLocationService)
        private userLocationService: UserLocationService,
        @Inject(() => NotificationService)
        private notificationService: NotificationService
    ) { }

    async handleOrderPaid(payload: any) {
        const paymentEntity = payload.payload.payment.entity;
        const paymentId = paymentEntity.id;
        const orderId = paymentEntity.order_id;
        const transactionId = paymentEntity.notes.transactionId;

        if (!transactionId) {
            logger.error("❌ Missing transactionId in notes");
        }

        let bookingUserId: string | null = null;

        const bookingDetails = await AppDataSource.manager.transaction(
            async (transactionalEntityManager) => {
                const transaction = await this.updateTransactionService.updateTransaction({
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

                const updatedBooking = await this.updateBookingService.updateBooking({
                    updatedBookingData: {
                        paid: true,
                    },
                    bookingId: transaction.data.bookingId,
                    manager: transactionalEntityManager,
                });

                logger.info("✅ Booking and transaction updated to SUCCESS!");
                return updatedBooking.data;
            }
        );

        if (bookingUserId && bookingDetails) {
            const nearByPandits = await this.userLocationService.findNearbyPandits({
                userId: bookingDetails.userId,
                timeSlotId: bookingDetails.timeSlotId,
                bookingDate: bookingDetails.bookingDate,
                radiusKm: bookingDetails.radiusKm,
            });

            await this.notificationService.publish(
                "booking_notification",
                "BOOKING_ACCEPTED",
                {
                    senderUserId: bookingUserId,
                    message: `You have a new booking.`,
                    receiverFcmTokens: nearByPandits,
                }
            );
        }
    }

    async handlePaymentFailed(payload: any) {
        const paymentEntity = payload.payload.payment.entity;
        const orderId = paymentEntity.order_id;
        const reason = paymentEntity.error_description || paymentEntity.error_reason;
        const paymentId = paymentEntity.id;
        const transactionId = paymentEntity.notes?.transactionId;

        logger.warn(`❌ Payment failed for Order ID: ${orderId} | Reason: ${reason}`);

        if (!transactionId) {
            logger.error("❌ Missing transactionId in payment.notes");
        }

        await this.updateTransactionService.updateTransaction({
            transactionId,
            orderId,
            updatedTransactionData: {
                status: TransactionStatus.FAILED,
                paymentMethod: paymentEntity.method,
                paymentReferenceId: paymentId,
            },
        });

        logger.info(`🚫 Marked transaction ${transactionId} as FAILED`);
    }

    async handleRefundProcessed(payload: any) {
        const refundEntity = payload.payload.refund.entity;
        const refundReferenceId = refundEntity.id;
        const paymentId = refundEntity.payment_id;
        const refundNotes = refundEntity.notes;

        if (!refundNotes?.refundId) {
            logger.error("❌ Missing refundId in notes");
        }

        await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
            const refundData = await this.updateRefundService.updateRefund({
                updatedRefundData: {
                    status: RefundStatus.SUCCESS,
                    refundedAt: new Date(),
                    refundReferenceId,
                },
                refundId: refundNotes.refundId,
                paymentReferenceId: paymentId,
                manager: transactionalEntityManager,
            });

            if (!refundData?.data?.transactionId) {
                logger.error("❌ Missing transactionId on refund entity");
                throw new CustomError("Missing transactionId on refund");
            }

            await this.updateTransactionService.updateTransaction({
                updatedTransactionData: {
                    isRefunded: true,
                },
                transactionId: refundData.data.transactionId,
                manager: transactionalEntityManager,
            });

            logger.info("✅ Refund and transaction updated to SUCCESS!");
        });
    }

    async handleRefundFailed(payload: any) {
        const refundEntity = payload.payload.refund.entity;
        const paymentId = refundEntity.payment_id;
        const refundNotes = refundEntity.notes;

        logger.error(
            `❌ Razorpay refund failed for paymentId: ${paymentId}, reason: ${refundEntity.error_description || "Unknown"
            }`
        );

        const refundData = await this.updateRefundService.updateRefund({
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
                `🔁 Scheduling retry attempt #${nextAttempt} for refundId: ${refundData.data.id
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
            logger.warn(`🚫 Max refund attempts reached for refundId: ${refundData.data.id}`);
        }
    }
}
