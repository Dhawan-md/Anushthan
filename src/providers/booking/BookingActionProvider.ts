import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { Booking } from "../../entities/Booking";

import { BookingInfoProvider } from "./BookingInfoProvider";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";

import { SingleBookingResponse } from "../../types/responses/BookingResponse";
import {
  AcceptBookingDto,
  CancelPanditBookingDto,
  CancelUserBookingDto,
  PlaceBookingDto,
} from "../../types/dtos/booking";
import {
  ActiveStatus,
  BookingStatus,
  PaymentType,
  RefundReason,
  UserCancellationReason,
  UserRole,
} from "../../utils/enums";
import { CustomError } from "../../utils/customError";
import {
  BOOKING_ACCEPTED,
  BOOKING_CANCELLED_PANDIT,
  BOOKING_CANCELLED_USER,
  BOOKING_PLACED,
  INTERNAL_ERROR_OCCURRED,
} from "../../utils/messages";
import { UpdateBookingProvider } from "./UpdateBookingProvider";
import { CancelBookingProvider } from "./CancelBookingProvider";
import { ServiceInfoProvider } from "../service/ServiceInfoProvider";
import { CancelledBooking } from "../../entities/CancelledBooking";
import { CANCELLATION_WINDOW_HOURS } from "../../utils/constants";
import { TransactionActionProvider } from "../transaction/TransactionActionProvider";
import { RazorpayProvider } from "../razorpay/RazorpayProvider";
import { UpdateTransactionProvider } from "../transaction/UpdateTransactionProvider";
import { Transaction } from "../../entities/Transaction";
import { RefundActionProvider } from "../refund/RefundActionProvider";
import { TransactionInfoProvider } from "../transaction/TransactionInfoProvider";

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
    private razorpayProvider: RazorpayProvider
  ) {
    this.bookingActionRepository =
      this.repositoryFactory.getRepository(Booking);
  }

  async placeBooking(params: PlaceBookingDto): Promise<SingleBookingResponse> {
    const { serviceIds, categoryId, userId, paid, totalPrice, paymentMethod } =
      params;
    logger.info(`📥 Placing a new booking for userId: ${userId}`);

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
        `⚠️ Duplicate booking attempt detected for userId: ${params.userId}`
      );

      throw new CustomError(
        "You already have a pending booking for these services at this time."
      );
    }
    const result = await this.bookingActionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const booking = await transactionalEntityManager.save(
          this.bookingActionRepository.create({
            ...params,
            paymentType: paid ? PaymentType.ONLINE : PaymentType.COD,
            status: BookingStatus.PENDING,
          })
        );

        let transaction: Transaction | null = null;
        if (paid) {
          transaction =
            await this.transactionActionProvider.createPaymentTransaction({
              userId,
              userRole: UserRole.USER,
              bookingId: booking.id,
              amount: totalPrice,
              paymentMethod,
              manager: transactionalEntityManager,
            });
        }

        return { booking, transaction };
      }
    );

    // ✅ Now outside the transaction — safe to call Razorpay
    if (paid && result.transaction) {
      const order = await this.razorpayProvider.createRazorpayOrder({
        amount: totalPrice,
        transactionId: result.transaction.id,
        userId,
      });

      await this.updateTransactionProvider.updateTransaction({
        updatedTransactionData: {
          orderId: order.id,
        },
        transactionId: result.transaction.id,
      });
    }

    logger.info(`✅ Booking placed with ID: ${result.booking.id}`);

    return new SingleBookingResponse(true, BOOKING_PLACED, result.booking);
  }

  async acceptBooking(
    params: AcceptBookingDto
  ): Promise<SingleBookingResponse> {
    const { bookingId, panditId } = params;
    logger.info(
      `📤 Pandit ${panditId} attempting to accept booking ${bookingId}`
    );

    const bookingDetails = await this.bookingInfoProvider.getBookingDetails(
      bookingId
    );

    if (!bookingDetails || bookingDetails.status !== BookingStatus.PENDING) {
      logger.warn(
        `⚠️ Booking ${bookingId} is invalid or has been ${bookingDetails.status}.`
      );
      throw new CustomError(
        `Invalid booking or booking has been ${bookingDetails.status}`
      );
    }

    await this.updateBookingProvider.updateBooking(
      { status: BookingStatus.ACCEPTED, panditId },
      bookingId
    );
    logger.info(`✅ Booking ${bookingId} accepted by pandit ${panditId}`);

    return new SingleBookingResponse(true, BOOKING_ACCEPTED);
  }

  async cancelBookingByUser(
    params: CancelUserBookingDto
  ): Promise<SingleBookingResponse> {
    const { bookingId, userId, confirmFee, cancelReason, customReason } =
      params;

    const booking = await this.bookingInfoProvider.getBookingDetails(bookingId);

    if (booking.userId !== userId)
      throw new CustomError("You are not authorized to cancel this booking.");

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.REJECTED
    ) {
      logger.warn(`⚠️ User tried to cancel a ${booking.status} booking.`);
      throw new CustomError(`You cannot cancel a ${booking.status} booking.`);
    }

    if (booking.status === BookingStatus.ACCEPTED && !booking.panditId) {
      logger.warn(`⚠️ Pandit must be assigned when booking is accepted.`);

      throw new CustomError(INTERNAL_ERROR_OCCURRED);
    }

    const refundTransactionObj =
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

          let paymentTransaction: Transaction | null = null;
          let refundId: string | null = null;

          if (booking.paid && refundAmount > 0) {
            paymentTransaction =
              await this.transactionInfoProvider.getPaymentTransaction({
                bookingId,
                userId,
              });

            if (paymentTransaction) {
              const refund = await this.refundActionProvider.createRefund({
                userId,
                userRole: UserRole.USER,
                bookingId,
                originalAmount: booking.totalPrice,
                refundAmount,
                refundReason: RefundReason.CANCELLATION,
                transactionId: paymentTransaction.id,
                manager: transactionalEntityManager,
              });

              refundId = refund.id;
            }
          }
          return { paymentTransaction, refundId };
        }
      );

    const transaction = refundTransactionObj.paymentTransaction;
    const refundId = refundTransactionObj.refundId;

    if (
      booking.paid &&
      transaction &&
      transaction.paymentReferenceId &&
      refundId
    ) {
      const order = await this.razorpayProvider.refundPayment({
        transactionId: transaction.id,
        paymentReferenceId: transaction.paymentReferenceId,
        refundAmount: transaction.amount,
        refundReason: RefundReason.CANCELLATION,
        bookingId,
        refundId,
      });

      logger.info(`successfully initiated refund: ${order}`);
    }

    return new SingleBookingResponse(true, BOOKING_CANCELLED_USER);
  }

  async cancelBookingByPandit(
    params: CancelPanditBookingDto
  ): Promise<SingleBookingResponse> {
    const { bookingId, panditId, confirmFee, cancelReason, customReason } =
      params;

    const booking = await this.bookingInfoProvider.getBookingDetails(bookingId);

    if (booking.panditId !== panditId) {
      throw new CustomError("You are not authorized to cancel this booking.");
    }

    if (booking.status !== BookingStatus.ACCEPTED) {
      throw new CustomError(
        "Booking cannot be cancelled in its current status."
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
          amount: isLateCancellation ? 100 : 0,
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
          `Booking ${bookingId} cancelled by pandit ${panditId}, penalty: ₹${100}`
        );
        return new SingleBookingResponse(
          true,
          BOOKING_CANCELLED_PANDIT,
          booking
        );
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
      await this.cancelBookingProvider.createCancellationFee({
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

    await this.updateBookingProvider.updateBooking(
      {
        status: BookingStatus.CANCELLED,
        cancellationId: cancelledBooking.id,
        cancelledAt: cancelledBooking.cancelledAt,
      },
      bookingId,
      transactionalEntityManager
    );

    return cancelledBooking;
  }

  //   async applyProviderPenalty(panditId: string, amount: number) {
  //     await this.panditRepo.increment({ id: panditId }, "ratings", -0.2); // Example penalty
  //     logger.warn(`Penalty applied to pandit ${panditId}, amount ₹${amount}`);
  //   }
}
