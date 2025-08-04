import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { BookingInfoProvider } from "./BookingInfoProvider";
import { UpdateBookingProvider } from "./UpdateBookingProvider";
import { CancelBookingProvider } from "./CancelBookingProvider";
import { ServiceInfoProvider } from "../service/ServiceInfoProvider";
import { TransactionInfoProvider } from "../transaction/TransactionInfoProvider";
import { RefundActionProvider } from "../refund/RefundActionProvider";
import { UpdateTransactionProvider } from "../transaction/UpdateTransactionProvider";
import { RazorpayProvider } from "../razorpay/RazorpayProvider";
import { TransactionActionProvider } from "../transaction/TransactionActionProvider";
import { NotificationProvider } from "../notification/notificationProvider";

import redis from "../../config/redis";

import { Booking } from "../../entities/Booking";
import { CancelledBooking } from "../../entities/CancelledBooking";
import { Transaction } from "../../entities/Transaction";
import { Refund } from "../../entities/Refund";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { generateOtp } from "../../helpers/generateOtp";
import { generateUserSecret } from "../../helpers/generateUserSecret";

import { retryRefundQueue } from "../../bullmq/queues/retryRefund.queue";
import { paymentTimeoutQueue } from "../../bullmq/queues/paymentTimeout.queue";

import { SingleBookingResponse } from "../../types/responses/BookingResponse";
import {
  AcceptBookingDto,
  CancelPanditBookingDto,
  CancelUserBookingDto,
  PlaceBookingDto,
} from "../../types/dtos/Booking";

import { generateRedisOtpKey } from "../../utils/generateRedisOtpKey";

import {
  ActiveStatus,
  BookingStatus,
  PaymentType,
  RefundReason,
  TransactionStatus,
  UserCancellationReason,
  UserRole,
} from "../../utils/enums";
import {
  BOOKING_ACCEPTED,
  BOOKING_CANCELLED_PANDIT,
  BOOKING_CANCELLED_USER,
  BOOKING_OTP_SENT,
  BOOKING_PLACED,
  INTERNAL_ERROR_OCCURRED,
} from "../../utils/messages";
import {
  CANCELLATION_WINDOW_HOURS,
  MAX_ATTEMPTS,
  PANDIT_CANCELLATION_FINE,
} from "../../utils/constants";
import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { PanditInfoProvider } from "../pandit/PanditInfoProvider";

@Service()
export class BookingActionProvider {
  private bookingActionRepository: Repository<Booking>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => BookingInfoProvider)
    private bookingInfoProvider: BookingInfoProvider,
    @Inject(() => UpdateBookingProvider)
    private updateBookingProvider: UpdateBookingProvider,
    @Inject(() => CancelBookingProvider)
    private cancelBookingProvider: CancelBookingProvider,
    @Inject(() => ServiceInfoProvider)
    private serviceInfoProvider: ServiceInfoProvider,
    @Inject(() => TransactionActionProvider)
    private transactionActionProvider: TransactionActionProvider,
    @Inject(() => TransactionInfoProvider)
    private transactionInfoProvider: TransactionInfoProvider,
    @Inject(() => UpdateTransactionProvider)
    private updateTransactionProvider: UpdateTransactionProvider,
    @Inject(() => RefundActionProvider)
    private refundActionProvider: RefundActionProvider,
    @Inject(() => RazorpayProvider)
    private razorpayProvider: RazorpayProvider,
    @Inject(() => NotificationProvider)
    private notificationProvider: NotificationProvider,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider
  ) {
    this.bookingActionRepository =
      this.repositoryFactory.getRepository(Booking);
  }

  async placeBooking(params: PlaceBookingDto): Promise<SingleBookingResponse> {
    const { serviceIds, categoryId, userId, totalPrice, paymentType } = params;
    logger.info(
      `[bookingActionProvider.ts] 📥 Placing a new booking for userId: ${userId}`
    );

    await this.bookingInfoProvider.isPendingAmount(userId);
    await this.serviceInfoProvider.doServicesBelongToCategory(
      serviceIds,
      categoryId
    );

    const isDuplicate = await this.bookingInfoProvider.isDuplicateBooking(
      params
    );

    if (isDuplicate) {
      logger.warn(
        `[bookingActionProvider.ts] ⚠️ Duplicate booking attempt detected for userId: ${userId}`
      );
      throw new CustomError(
        "You already have a pending booking for these services at this time."
      );
    }

    const { booking, transaction } =
      await this.bookingActionRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const booking = await transactionalEntityManager.save(Booking, {
            ...params,
          });

          let transaction: Transaction | null = null;

          if (paymentType === PaymentType.ONLINE) {
            transaction =
              await this.transactionActionProvider.createPaymentTransaction({
                userId,
                userRole: UserRole.USER,
                bookingId: booking.id,
                amount: totalPrice,
                manager: transactionalEntityManager,
              });
          }

          return { booking, transaction };
        }
      );

    // ✅ Now outside the transaction — safe to call Razorpay
    if (paymentType === PaymentType.ONLINE && transaction) {
      try {
        const order = await this.razorpayProvider.createRazorpayOrder({
          amount: totalPrice,
          transactionId: transaction.id,
        });

        logger.info(
          `[bookingActionProvider.ts] 🧾 Queueing payment timeout job booking id: ${booking.id} and transaction id: ${transaction.id}`
        );

        await paymentTimeoutQueue.add(
          "check-payment-timeout",
          {
            bookingId: String(booking.id),
            transactionId: String(transaction.id),
          },
          {
            attempts: MAX_ATTEMPTS,
            backoff: { type: "exponential", delay: 30000 },
            delay: 15 * 60 * 1000,
          }
        );

        await this.updateTransactionProvider.updateTransaction({
          updatedTransactionData: {
            orderId: order.id,
          },
          transactionId: transaction.id,
        });

        logger.info(
          `[bookingActionProvider.ts] ✅ Razorpay order created and transaction updated: ${transaction.id}`
        );
      } catch (error) {
        logger.error(
          "[bookingActionProvider.ts] ❌ Failed during Razorpay payment setup",
          error
        );

        // Optional rollback logic
        await this.updateBookingProvider.updateBooking({
          updatedBookingData: { status: BookingStatus.REJECTED },
          bookingId: booking.id,
        });

        await this.updateTransactionProvider.updateTransaction({
          updatedTransactionData: { status: TransactionStatus.FAILED },
          transactionId: transaction.id,
        });

        throw new CustomError(
          "Something went wrong while setting up the payment. Please try again."
        );
      }
    }
    logger.info(
      `[bookingActionProvider.ts] ✅ Booking placed with ID: ${booking.id}`
    );

    await this.notificationProvider.publish(
      "booking_notification",
      "BOOKING_ACCEPTED",
      {
        userId: booking.userId,
        message: `Your booking #${booking.id} has been accepted by the pandit.`,
        fcmToken: true,
      }
    );

    return new SingleBookingResponse(true, BOOKING_PLACED, booking);
  }

  async acceptBooking(
    params: AcceptBookingDto
  ): Promise<SingleBookingResponse> {
    const { bookingId, panditId } = params;
    logger.info(
      `[bookingActionProvider.ts] 📤 Pandit ${panditId} attempting to accept booking ${bookingId}`
    );

    const bookingDetails = await this.bookingInfoProvider.getBookingDetails({
      bookingId,
    });

    const panditDetails = await this.panditInfoProvider.getPandit({
      data: { id: panditId },
      withCategory: true,
    });

    if (bookingDetails.status !== BookingStatus.PENDING) {
      logger.warn(
        `[bookingActionProvider.ts] ⚠️ Booking has been ${bookingDetails.status}.`
      );
      throw new CustomError(`Booking has been ${bookingDetails.status}`);
    }

    const hasCategory = panditDetails.categories.some(
      (category) => category.id === bookingDetails.categoryId
    );

    if (!hasCategory) {
      logger.warn(
        `[bookingActionProvider.ts] ❌ Pandit ${panditId} is not registered in category ${bookingDetails.categoryId}`
      );
      throw new CustomError(
        "You are not eligible to accept this booking category"
      );
    }

    if (
      bookingDetails.paymentType == PaymentType.ONLINE &&
      !bookingDetails.paid
    ) {
      logger.error(
        `[bookingActionProvider.ts] ❌ Booking ID ${bookingDetails.id} has payment type ONLINE but is yet to be paid.`
      );

      throw new CustomError("The booking is not paid so cannot be accepted.");
    }

    return await this.bookingActionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const result = await transactionalEntityManager
          .createQueryBuilder()
          .update(Booking)
          .set({ status: BookingStatus.ACCEPTED, panditId })
          .where("id = :bookingId", { bookingId })
          .andWhere("status = :status", { status: BookingStatus.PENDING })
          .execute();

        if (result.affected === 0) {
          throw new CustomError(
            "Booking could not be accepted. It may have already been accepted."
          );
        }

        logger.info(
          `[bookingActionProvider.ts] ✅ Booking ${bookingId} accepted by pandit ${panditId}`
        );

        return new SingleBookingResponse(true, BOOKING_ACCEPTED);
      }
    );
  }

  async initiateStartBooking(
    bookingId: string,
    panditId: string
  ): Promise<SingleBookingResponse> {
    logger.info(
      `[bookingActionProvider.ts] 📦 Initiating startBooking for bookingId=${bookingId}, panditId=${panditId}`
    );

    const bookingDetails = await this.bookingInfoProvider.getBookingDetails({
      bookingId,
      filters: {
        panditId,
      },
    });

    if (bookingDetails.status !== BookingStatus.ACCEPTED) {
      logger.warn(
        `[bookingActionProvider.ts] ❌ Cannot initiate start. Booking ${bookingId} is in ${bookingDetails.status} status.)`
      );

      throw new CustomError("Booking is not confirmed or already started.");
    }

    const redisKey = generateRedisOtpKey(bookingDetails.userId, bookingId);

    const ttl = await redis.ttl(redisKey); // time-to-live in seconds
    if (ttl > 240) {
      logger.warn(
        `[bookingActionProvider.ts] 🚫 OTP already generated for booking ${bookingId}. Wait for ${
          ttl - 240
        } seconds to regenrate.`
      );
      throw new CustomError(
        "OTP already sent recently. Please wait a few seconds before retrying."
      );
    }

    const userSecret = generateUserSecret();
    const otpDetails = generateOtp(userSecret.base32);

    await redis.setex(redisKey, 5 * 60, otpDetails.otpCode);

    logger.info(
      `[bookingActionProvider.ts] 🔐 OTP stored in Redis for key=${redisKey}, expires in 5 min`
    );

    // Replace with real notification
    if (process.env.NODE_ENV !== "production") {
      logger.info(
        `[bookingActionProvider.ts] OTP for booking ${bookingId}: ${otpDetails.otpCode}`
      );
    }

    return new SingleBookingResponse(true, BOOKING_OTP_SENT);
  }

  async finalizeStartBooking(
    bookingId: string,
    panditId: string,
    otpCode: string
  ): Promise<SingleBookingResponse> {
    logger.info(
      `[bookingActionProvider.ts] ✅ Finalizing startBooking for bookingId=${bookingId}, panditId=${panditId}`
    );

    const bookingDetails = await this.bookingInfoProvider.getBookingDetails({
      bookingId,
      filters: {
        panditId,
      },
    });

    if (bookingDetails.status !== BookingStatus.ACCEPTED) {
      logger.info(
        `BookingActionProvider.ts] ⚠️ Booking is in ${bookingDetails.status} state.`
      );
      throw new CustomError(`Booking is in ${bookingDetails.status} state.`);
    }

    const redisKey = generateRedisOtpKey(bookingDetails.userId, bookingId);
    const storedOtp = await redis.get(redisKey);

    if (!storedOtp) {
      logger.warn(
        `[bookingActionProvider.ts] ⚠️ OTP expired or not found for booking ${bookingId} (key=${redisKey})`
      );
      throw new CustomError("OTP expired or not generated.");
    }

    if (storedOtp !== otpCode) {
      logger.warn(
        `[bookingActionProvider.ts] 🚫 Invalid OTP for booking ${bookingId}, userInput=${otpCode}`
      );
      throw new CustomError("Invalid OTP.");
    }

    await redis.del(redisKey);
    logger.info(
      `[bookingActionProvider.ts] 🧹 OTP key ${redisKey} cleared from Redis`
    );

    await this.updateBookingProvider.updateBooking({
      bookingId,
      updatedBookingData: {
        status: BookingStatus.STARTED,
        startedAt: new Date(),
      },
    });

    logger.info(
      `[bookingActionProvider.ts] 🟢 Booking ${bookingId} marked as STARTED`
    );

    logger.info(
      `[bookingActionProvider.ts] ✅ Booking ${bookingId} started successfully by pandit ${panditId}`
    );

    return new SingleBookingResponse(true, "Booking started successfully.");
  }

  async cancelBookingByUser(
    params: CancelUserBookingDto
  ): Promise<SingleBookingResponse> {
    const { bookingId, userId, confirmFee, cancelReason, customReason } =
      params;

    const booking = await this.bookingInfoProvider.getBookingDetails({
      bookingId,
    });

    if (booking.userId !== userId)
      throw new CustomError("You are not authorized to cancel this booking.");

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.REJECTED
    ) {
      logger.warn(
        `[bookingActionProvider.ts] ⚠️ User tried to cancel a ${booking.status} booking.`
      );
      throw new CustomError(`You cannot cancel a ${booking.status} booking.`);
    }

    if (booking.status === BookingStatus.ACCEPTED && !booking.panditId) {
      logger.warn(
        `[bookingActionProvider.ts] ⚠️ Pandit must be assigned when booking is accepted.`
      );

      throw new CustomError(INTERNAL_ERROR_OCCURRED);
    }

    const { transaction, refund } =
      await this.bookingActionRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const amount = booking.totalPrice;
          const isPenalty = booking.status === BookingStatus.ACCEPTED;

          if (isPenalty && !confirmFee) {
            throw new CustomError(
              `❌ Cancelling this booking will incur a 100% fee of ₹${amount}. Please confirm.`
            );
          }
          const penaltyAmount = isPenalty ? amount : 0;
          const refundAmount = booking.totalPrice - penaltyAmount;

          await this.performCancellation({
            userId,
            panditId: booking.panditId,
            bookingId,
            cancelledBy: UserRole.USER,
            amount: penaltyAmount,
            cancelReason,
            customReason,
            transactionalEntityManager,
          });

          let transaction: Transaction | null = null;
          let refund: Refund | null = null;

          if (booking.paid && refundAmount > 0) {
            transaction = await this.transactionInfoProvider.getTransaction({
              bookingId,
            });

            if (transaction && transaction.paymentReferenceId) {
              refund = await this.refundActionProvider.createRefund({
                userId,
                userRole: UserRole.USER,
                bookingId,
                originalAmount: booking.totalPrice,
                refundAmount,
                refundReason: RefundReason.CANCELLATION,
                transactionId: transaction.id,
                paymentReferenceId: transaction.paymentReferenceId,
                attemptNumber: 1,
                manager: transactionalEntityManager,
              });
            }
          }
          return { transaction, refund };
        }
      );

    if (
      booking.paid &&
      transaction &&
      transaction.paymentReferenceId &&
      refund
    ) {
      logger.info(
        `[bookingActionProvider.ts] 🧾 Queuing refund attempt #1 for booking ${booking.id}, refundId: ${refund.id}`
      );

      await retryRefundQueue.add("retry-refund", {
        transactionId: transaction.id,
        paymentReferenceId: transaction.paymentReferenceId,
        refundAmount: refund.refundAmount,
        refundReason: RefundReason.CANCELLATION,
        bookingId,
        refundId: refund.id,
        userId,
        attemptNumber: 1,
        originalAmount: refund.originalAmount,
      });
    }

    return new SingleBookingResponse(true, BOOKING_CANCELLED_USER);
  }

  async cancelBookingByPandit(
    params: CancelPanditBookingDto
  ): Promise<SingleBookingResponse> {
    const { bookingId, panditId, confirmFee, cancelReason, customReason } =
      params;

    const booking = await this.bookingInfoProvider.getBookingDetails({
      bookingId,
    });

    if (booking.panditId !== panditId) {
      throw new CustomError("You are not authorized to cancel this booking.");
    }

    if (booking.status !== BookingStatus.ACCEPTED) {
      throw new CustomError(
        `Booking cannot be cancelled while in ${booking.status} state`
      );
    }

    const now = new Date();

    const diffHours =
      (booking.timeSlot.getTime() - now.getTime()) / (1000 * 60 * 60);

    const isLateCancellation = diffHours < CANCELLATION_WINDOW_HOURS;

    if (isLateCancellation && !confirmFee) {
      throw new CustomError(
        `Cannot cancel booking less than ${CANCELLATION_WINDOW_HOURS} hours before the scheduled time. A cancellation fee will be charged.`
      );
    }

    return await this.bookingActionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await this.performCancellation({
          userId: booking.userId,
          panditId,
          bookingId,
          cancelledBy: UserRole.PANDIT,
          amount: isLateCancellation ? PANDIT_CANCELLATION_FINE : 0,
          cancelReason,
          customReason,
          transactionalEntityManager,
        });

        // TODO: Implement refund logic if booking.paid === true
        // if (booking.paid) {
        //   await refundUser(booking.userId, booking.totalPrice);
        // }

        // TODO: Apply penalty logic here (e.g., increment provider penalty count, reduce rating)
        // await applyProviderPenalty(panditId, PROVIDER_PENALTY_AMOUNT);

        // TODO: Notify user and provider about cancellation
        // notifyUser(
        //   booking.userId,
        //   `Your booking ${booking.id} was cancelled by the provider.`
        // );
        // notifyProvider(
        //   panditId,
        //   `You have cancelled booking ${booking.id}. A penalty has been applied.`
        // );

        logger.info(
          `[bookingActionProvider.ts] Booking ${bookingId} cancelled by pandit ${panditId}, penalty: ₹${100}`
        );
        return new SingleBookingResponse(true, BOOKING_CANCELLED_PANDIT);
      }
    );
  }

  private async performCancellation({
    userId,
    panditId,
    bookingId,
    cancelledBy,
    amount,
    cancelReason,
    customReason,
    transactionalEntityManager,
  }: {
    userId: string;
    panditId?: string;
    bookingId: string;
    cancelledBy: UserRole;
    amount: number;
    cancelReason: UserCancellationReason;
    customReason?: string;
    transactionalEntityManager: EntityManager;
  }): Promise<CancelledBooking> {
    const cancelledBooking =
      await this.cancelBookingProvider.createCancellation({
        userId,
        panditId,
        bookingId,
        amount,
        cancelledBy,
        cancelReason,
        customReason,
        cancelledAt: new Date(),
        isPenaltyApplied: amount > 0,
        status: amount > 0 ? ActiveStatus.ACTIVE : ActiveStatus.INACTIVE,
      });

    await this.updateBookingProvider.updateBooking({
      updatedBookingData: {
        status: BookingStatus.CANCELLED,
        cancelled_booking: cancelledBooking,
        cancelledAt: cancelledBooking.createdAt,
      },
      bookingId,
      manager: transactionalEntityManager,
    });

    return cancelledBooking;
  }

  //   async applyProviderPenalty(panditId: string, amount: number) {
  //     await this.panditRepo.increment({ id: panditId }, "ratings", -0.2); // Example penalty
  //     logger.warn(`[bookingActionProvider.ts] Penalty applied to pandit ${panditId}, amount ₹${amount}`);
  //   }
}
