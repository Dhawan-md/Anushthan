import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { BookingInfoService } from "./BookingInfoService";
import { UpdateBookingService } from "./UpdateBookingService";
import { CancelBookingService } from "./CancelBookingService";
import { ServiceInfoService } from "../service/ServiceInfoService";
import { TransactionInfoService } from "../transaction/TransactionInfoService";
import { RefundActionService } from "../refund/RefundActionService";
import { UpdateTransactionService } from "../transaction/UpdateTransactionService";
import { RazorpayService } from "../../infrastructure/razorpay/RazorpayService";
import { TransactionActionService } from "../transaction/TransactionActionService";
import { NotificationService } from "../notification/NotificationService";
import { PanditInfoService } from "../pandit/PanditInfoService";
import { UserLocationService } from "../user/UserLocationService";
import { TimeSlotService } from "../admin/timeSlot/TimeSlotService";

import { env } from "../../config/env";
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
} from "../../types/dtos/booking";

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
  ACTIVE_BOOKING_FOUND,
  BOOKING_ACCEPTED,
  BOOKING_CANCELLED_PANDIT,
  BOOKING_CANCELLED_USER,
  BOOKING_OTP_SENT,
  BOOKING_PLACED,
  INTERNAL_ERROR_OCCURRED,
  TIME_SLOT_NOT_FOUND,
} from "../../utils/messages";
import {
  CANCELLATION_WINDOW_HOURS,
  MAX_ATTEMPTS,
  PANDIT_CANCELLATION_FINE,
} from "../../utils/constants";
import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { getHoursDiffFromStartTime } from "../../utils/getHoursDiffFromStartTime";

@Service()
export class BookingActionService {
  private bookingActionRepository: Repository<Booking>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => BookingInfoService)
    private bookingInfoService: BookingInfoService,
    @Inject(() => UpdateBookingService)
    private updateBookingService: UpdateBookingService,
    @Inject(() => CancelBookingService)
    private cancelBookingService: CancelBookingService,
    @Inject(() => ServiceInfoService)
    private serviceInfoService: ServiceInfoService,
    @Inject(() => TransactionActionService)
    private transactionActionService: TransactionActionService,
    @Inject(() => TransactionInfoService)
    private transactionInfoService: TransactionInfoService,
    @Inject(() => UpdateTransactionService)
    private updateTransactionService: UpdateTransactionService,
    @Inject(() => RefundActionService)
    private refundActionService: RefundActionService,
    @Inject(() => RazorpayService)
    private razorpayService: RazorpayService,
    @Inject(() => NotificationService)
    private notificationService: NotificationService,
    @Inject(() => PanditInfoService)
    private panditInfoService: PanditInfoService,
    @Inject(() => UserLocationService)
    private userLocationService: UserLocationService,
    @Inject(() => TimeSlotService) private timeSlotService: TimeSlotService
  ) {
    this.bookingActionRepository =
      this.repositoryFactory.getRepository(Booking);
  }

  async placeBooking(params: PlaceBookingDto): Promise<SingleBookingResponse> {
    const { serviceIds, categoryId, userId, totalPrice, paymentType } = params;
    logger.info(
      `[bookingActionService.ts] 📥 Placing a new booking for userId: ${userId}`
    );

    await this.bookingInfoService.isPendingAmount(userId);
    await this.serviceInfoService.doServicesBelongToCategory(
      serviceIds,
      categoryId
    );

    const isDuplicate =
      await this.bookingInfoService.isDuplicateBooking(params);

    if (isDuplicate) {
      logger.warn(
        `[bookingActionService.ts] ⚠️ Duplicate booking attempt detected for userId: ${userId}`
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
              await this.transactionActionService.createPaymentTransaction({
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
        const order = await this.razorpayService.createRazorpayOrder({
          amount: totalPrice,
          transactionId: transaction.id,
        });

        logger.info(
          `[bookingActionService.ts] 🧾 Queueing payment timeout job booking id: ${booking.id} and transaction id: ${transaction.id}`
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

        await this.updateTransactionService.updateTransaction({
          updatedTransactionData: {
            orderId: order.id,
          },
          transactionId: transaction.id,
        });

        logger.info(
          `[bookingActionService.ts] ✅ Razorpay order created and transaction updated: ${transaction.id}`
        );
      } catch (error) {
        logger.error(
          "[bookingActionService.ts] ❌ Failed during Razorpay payment setup",
          error
        );

        // Optional rollback logic
        await this.updateBookingService.updateBooking({
          updatedBookingData: { status: BookingStatus.REJECTED },
          bookingId: booking.id,
        });

        await this.updateTransactionService.updateTransaction({
          updatedTransactionData: { status: TransactionStatus.FAILED },
          transactionId: transaction.id,
        });

        throw new CustomError(
          "Something went wrong while setting up the payment. Please try again."
        );
      }
    } else {
      const nearbyPandits = await this.userLocationService.findNearbyPandits({
        userId,
        timeSlotId: booking.timeSlotId,
        bookingDate: booking.bookingDate,
        radiusKm: booking.radiusKm,
      });

      await this.notificationService.publish(
        "booking_notification",
        "BOOKING_ACCEPTED",
        {
          senderUserId: booking.userId,
          message: `New booking #${booking.id} is available.`,
          receiverFcmTokens: nearbyPandits,
        }
      );

      logger.info(
        `[bookingActionService.ts] 📢 Sent booking notification to ${nearbyPandits.data?.length} nearby Pandits`
      );
    }

    logger.info(
      `[bookingActionService.ts] ✅ Booking placed with ID: ${booking.id}`
    );

    return new SingleBookingResponse(true, BOOKING_PLACED, booking);
  }

  async acceptBooking(
    params: AcceptBookingDto
  ): Promise<SingleBookingResponse> {
    const { bookingId, panditId } = params;
    logger.info(
      `[bookingActionService.ts] 📤 Pandit ${panditId} attempting to accept booking ${bookingId}`
    );

    const bookingDetails = await this.bookingInfoService.getBookingDetails({
      bookingId,
    });

    const IsBusyPandit = await this.bookingInfoService.isPanditBusy({
      id: panditId,
      filters: {
        timeSlotId: bookingDetails.timeSlotId,
        bookingDate: bookingDetails.bookingDate,
      },
    });

    if (IsBusyPandit) {
      logger.info(
        `Pandit ${panditId} already has an active booking in this time slot.`
      );

      throw new CustomError(ACTIVE_BOOKING_FOUND);
    }

    const panditDetails = await this.panditInfoService.getPandit({
      data: { id: panditId },
      withCategory: true,
    });

    const userLocationDetails =
      await this.userLocationService.getResolvedLocationDetails(
        bookingDetails.userId
      );
    const panditLocationDetails =
      await this.userLocationService.getResolvedLocationDetails(
        panditDetails.id,
        UserRole.PANDIT
      );

    const isPanditWithinRadius = this.panditInfoService.isPanditWithinRadius(
      userLocationDetails.latitude,
      userLocationDetails.longitude,
      panditLocationDetails.latitude,
      panditLocationDetails.longitude,
      bookingDetails.radiusKm
    );

    if (!isPanditWithinRadius) {
      logger.warn(
        `[bookingActionService.ts] ❌ Pandit ${panditId} is not within the required radius of ${bookingDetails.radiusKm} km.`
      );
      throw new CustomError(
        "You are not eligible to accept this booking category"
      );
    }

    if (bookingDetails.status !== BookingStatus.PENDING) {
      logger.warn(
        `[bookingActionService.ts] ⚠️ Booking has been ${bookingDetails.status}.`
      );
      throw new CustomError(`Booking has been ${bookingDetails.status}`);
    }

    const hasCategory = panditDetails.categories.some(
      (category) => category.id === bookingDetails.categoryId
    );

    if (!hasCategory) {
      logger.warn(
        `[bookingActionService.ts] ❌ Pandit ${panditId} is not registered in category ${bookingDetails.categoryId}`
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
        `[bookingActionService.ts] ❌ Booking ID ${bookingDetails.id} has payment type ONLINE but is yet to be paid.`
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
          `[bookingActionService.ts] ✅ Booking ${bookingId} accepted by pandit ${panditId}`
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
      `[bookingActionService.ts] 📦 Initiating startBooking for bookingId=${bookingId}, panditId=${panditId}`
    );

    const bookingDetails = await this.bookingInfoService.getBookingDetails({
      bookingId,
      filters: {
        panditId,
      },
    });

    if (bookingDetails.status !== BookingStatus.ACCEPTED) {
      logger.warn(
        `[bookingActionService.ts] ❌ Cannot initiate start. Booking ${bookingId} is in ${bookingDetails.status} status.)`
      );

      throw new CustomError("Booking is not confirmed or already started.");
    }

    const redisKey = generateRedisOtpKey(bookingDetails.userId, bookingId);

    const ttl = await redis.ttl(redisKey); // time-to-live in seconds
    if (ttl > 240) {
      logger.warn(
        `[bookingActionService.ts] 🚫 OTP already generated for booking ${bookingId}. Wait for ${ttl - 240
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
      `[bookingActionService.ts] 🔐 OTP stored in Redis for key=${redisKey}, expires in 5 min`
    );

    // Replace with real notification
    if (env.NODE_ENV !== "production") {
      logger.info(
        `[bookingActionService.ts] OTP for booking ${bookingId}: ${otpDetails.otpCode}`
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
      `[bookingActionService.ts] ✅ Finalizing startBooking for bookingId=${bookingId}, panditId=${panditId}`
    );

    const bookingDetails = await this.bookingInfoService.getBookingDetails({
      bookingId,
      filters: {
        panditId,
      },
    });

    if (bookingDetails.status !== BookingStatus.ACCEPTED) {
      logger.info(
        `BookingActionService.ts] ⚠️ Booking is in ${bookingDetails.status} state.`
      );
      throw new CustomError(`Booking is in ${bookingDetails.status} state.`);
    }

    const redisKey = generateRedisOtpKey(bookingDetails.userId, bookingId);
    const storedOtp = await redis.get(redisKey);

    if (!storedOtp) {
      logger.warn(
        `[bookingActionService.ts] ⚠️ OTP expired or not found for booking ${bookingId} (key=${redisKey})`
      );
      throw new CustomError("OTP expired or not generated.");
    }

    if (storedOtp !== otpCode) {
      logger.warn(
        `[bookingActionService.ts] 🚫 Invalid OTP for booking ${bookingId}, userInput=${otpCode}`
      );
      throw new CustomError("Invalid OTP.");
    }

    await redis.del(redisKey);
    logger.info(
      `[bookingActionService.ts] 🧹 OTP key ${redisKey} cleared from Redis`
    );

    await this.updateBookingService.updateBooking({
      bookingId,
      updatedBookingData: {
        status: BookingStatus.STARTED,
        startedAt: new Date(),
      },
    });

    logger.info(
      `[bookingActionService.ts] 🟢 Booking ${bookingId} marked as STARTED`
    );

    logger.info(
      `[bookingActionService.ts] ✅ Booking ${bookingId} started successfully by pandit ${panditId}`
    );

    return new SingleBookingResponse(true, "Booking started successfully.");
  }

  async cancelBookingByUser(
    params: CancelUserBookingDto
  ): Promise<SingleBookingResponse> {
    const { bookingId, userId, confirmFee, cancelReason, customReason } =
      params;

    const booking = await this.bookingInfoService.getBookingDetails({
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
        `[bookingActionService.ts] ⚠️ User tried to cancel a ${booking.status} booking.`
      );
      throw new CustomError(`You cannot cancel a ${booking.status} booking.`);
    }

    if (booking.status === BookingStatus.ACCEPTED && !booking.panditId) {
      logger.warn(
        `[bookingActionService.ts] ⚠️ Pandit must be assigned when booking is accepted.`
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
            transaction = await this.transactionInfoService.getTransaction({
              bookingId,
            });

            if (transaction && transaction.paymentReferenceId) {
              refund = await this.refundActionService.createRefund({
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
        `[bookingActionService.ts] 🧾 Queuing refund attempt #1 for booking ${booking.id}, refundId: ${refund.id}`
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

    const booking = await this.bookingInfoService.getBookingDetails({
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

    const timeSlot = await this.timeSlotService.getTimeSlot(
      booking.timeSlotId
    );

    if (!timeSlot.data) {
      logger.error(
        `[bookingActionService.ts]❌ Booking ${bookingId} cancelling action failed due to time slot fetch faliure.`
      );
      throw new CustomError(TIME_SLOT_NOT_FOUND);
    }

    const diffHours = getHoursDiffFromStartTime(
      booking.bookingDate,
      timeSlot.data.startTime
    );

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

        // TODO: Apply penalty logic here (e.g., increment service penalty count, reduce rating)
        // await applyServicePenalty(panditId, PROVIDER_PENALTY_AMOUNT);

        // TODO: Notify user and service about cancellation
        // notifyUser(
        //   booking.userId,
        //   `Your booking ${booking.id} was cancelled by the service.`
        // );
        // notifyService(
        //   panditId,
        //   `You have cancelled booking ${booking.id}. A penalty has been applied.`
        // );

        logger.info(
          `[bookingActionService.ts] Booking ${bookingId} cancelled by pandit ${panditId}, penalty: ₹${100}`
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
      await this.cancelBookingService.createCancellation({
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

    await this.updateBookingService.updateBooking({
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

  //   async applyServicePenalty(panditId: string, amount: number) {
  //     await this.panditRepo.increment({ id: panditId }, "ratings", -0.2); // Example penalty
  //     logger.warn(`[bookingActionService.ts] Penalty applied to pandit ${panditId}, amount ₹${amount}`);
  //   }
}
