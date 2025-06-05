import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { Booking } from "../../entities/Booking";

import { BookingInfoProvider } from "./BookingInfoProvider";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";

import { SingleBookingResponse } from "../../types/responses/BookingResponse";
import {
  AcceptBookingDto,
  CancelUserBookingDto,
  PlaceBookingDto,
} from "../../types/dtos/booking";
import { BookingStatus } from "../../utils/enums";
import { CustomError } from "../../utils/customError";
import {
  BOOKING_ACCEPTED,
  BOOKING_CANCELLED,
  BOOKING_PLACED,
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

  async cancelUserBooking(
    params: CancelUserBookingDto
  ): Promise<SingleBookingResponse> {
    const { bookingId, userId, confirmFee } = params;

    const booking = await this.bookingInfoProvider.getBookingDetails(bookingId);

    if (!booking) throw new CustomError("Booking not found.");
    if (booking.userId !== userId)
      throw new CustomError("You are not authorized to cancel this booking.");

    return await this.bookingActionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        if (booking.status === BookingStatus.ACCEPTED) {
          const feeAmount = booking.totalPrice ?? 1000;

          if (!confirmFee) {
            throw new CustomError(
              `Cancelling this booking will incur a 100% fee of ₹${feeAmount}. Please confirm.`
            );
          }

          await this.cancelBookingProvider.createCancellationFee({
            userId,
            bookingId,
            amount: feeAmount,
          });
        } else if (
          booking.status === BookingStatus.CANCELLED ||
          booking.status === BookingStatus.COMPLETED ||
          booking.status === BookingStatus.REJECTED
        ) {
          logger.warn(`⚠️ User tried to cancel a ${booking.status} booking.`);
          throw new CustomError(
            `You cannot cancel a ${booking.status} booking.`
          );
        }
        await this.updateBookingProvider.updateBooking(
          { status: BookingStatus.CANCELLED },
          bookingId,
          transactionalEntityManager
        );

        return new SingleBookingResponse(true, BOOKING_CANCELLED);
      }
    );
  }
}
