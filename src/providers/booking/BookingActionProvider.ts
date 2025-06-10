import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

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
import { BookingStatus, UserRole } from "../../utils/enums";
import { CustomError } from "../../utils/customError";
import {
  BOOKING_ACCEPTED,
  BOOKING_CANCELLED,
  BOOKING_PLACED,
  INTERNAL_ERROR_OCCURRED,
} from "../../utils/messages";
import { UpdateBookingProvider } from "./UpdateBookingProvider";
import { CancelBookingProvider } from "./CancelBookingProvider";

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
    private cancelBookingProvider: CancelBookingProvider
  ) {
    this.bookingActionRepository =
      this.repositoryFactory.getRepository(Booking);
  }

  async placeBooking(params: PlaceBookingDto): Promise<SingleBookingResponse> {
    logger.info(`📥 Placing a new booking for userId: ${params.userId}`);

    await this.bookingInfoProvider.isPendingAmount(params.userId);

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

    const booking = await this.bookingActionRepository.save({
      ...params,
      status: BookingStatus.PENDING,
    });

    logger.info(`✅ Booking placed with ID: ${booking.id}`);

    return new SingleBookingResponse(true, BOOKING_PLACED, booking);
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

    return await this.bookingActionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const feeAmount = booking.totalPrice;
        const isPenalty = booking.status === BookingStatus.ACCEPTED;

        if (isPenalty && !confirmFee) {
          throw new CustomError(
            `❌ Cancelling this booking will incur a 100% fee of ₹${feeAmount}. Please confirm.`
          );
        }

        const cancelledBooking =
          await this.cancelBookingProvider.createCancellationFee({
            userId,
            panditId: booking.panditId,
            bookingId,
            penaltyAmount: isPenalty ? feeAmount : 0,
            refundAmount:
              booking.status === BookingStatus.PENDING ? feeAmount : 0,
            cancelledBy: UserRole.USER,
            isPenaltyApplied: isPenalty,
            cancelReason,
            customReason,
            cancelledAt: new Date(),
          });

        await this.updateBookingProvider.updateBooking(
          {
            status: BookingStatus.CANCELLED,
            cancellationId: cancelledBooking.id,
          },
          bookingId,
          transactionalEntityManager
        );

        return new SingleBookingResponse(true, BOOKING_CANCELLED);
      }
    );
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
    const isPenalty = diffHours < CANCELLATION_WINDOW_HOURS;
    if (isPenalty && !confirmFee) {
      throw new CustomError(
        `Cannot cancel booking less than ${CANCELLATION_WINDOW_HOURS} hours before the scheduled time. A cancellation fee will be charged.`
      );
    }

    return await this.bookingActionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const cancelledBooking =
          await this.cancelBookingProvider.createCancellationFee({
            userId: booking.userId,
            panditId,
            bookingId,
            penaltyAmount: diffHours < CANCELLATION_WINDOW_HOURS ? 100 : 0,
            refundAmount: booking.paid ? booking.totalPrice : 0, // refund amount if paid
            cancelledBy: UserRole.PANDIT,
            cancelReason,
            customReason,
            isPenaltyApplied: diffHours < CANCELLATION_WINDOW_HOURS,
            cancelledAt: now,
          });

        await this.updateBookingProvider.updateBooking(
          {
            status: BookingStatus.CANCELLED,
            cancelledAt: now,
            cancellationId: cancelledBooking.id,
          },
          bookingId,
          transactionalEntityManager
        );

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

        return new SingleBookingResponse(
          true,
          "Booking cancelled successfully by pandit",
          booking
        );
      }
    );
  }
}
