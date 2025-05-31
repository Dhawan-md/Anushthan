import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { Booking } from "../../entities/Booking";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";

import { SingleBookingResponse } from "../../types/responses/BookingResponse";
import { acceptBookingDto, placeBookingDto } from "../../types/dtos/booking";
import { BookingStatus } from "../../utils/enums";
import { BookingInfoProvider } from "./BookingInfoProvider";
import { CustomError } from "../../utils/customError";

@Service()
export class BookingActionProvider {
  private bookingActionRepository: Repository<Booking>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => BookingInfoProvider)
    private bookingInfoProvider: BookingInfoProvider
  ) {
    this.bookingActionRepository =
      this.repositoryFactory.getRepository(Booking);
  }

  async placeBooking(params: placeBookingDto): Promise<SingleBookingResponse> {
    logger.info(`📥 Placing a new booking for userId: ${params.userId}`);

    const isDuplicate = await this.bookingInfoProvider.isDuplicateBooking(
      params
    );

    if (isDuplicate) {
      logger.warn(
        `⚠️ Duplicate booking attempt detected for userId: ${params.userId}`
      );
      return new SingleBookingResponse(
        false,
        "You already have a pending booking for these services at this time."
      );
    }

    const booking = await this.bookingActionRepository.save({
      ...params,
      estimatedTime: 100,
      status: BookingStatus.PENDING,
    });

    logger.info(`✅ Booking placed with ID: ${booking.id}`);

    return new SingleBookingResponse(true, "booking places", booking);
  }

  async acceptBooking(
    params: acceptBookingDto
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

    bookingDetails.panditId = panditId;
    bookingDetails.status = BookingStatus.ACCEPTED;

    await this.bookingActionRepository.save(bookingDetails);
    logger.info(`✅ Booking ${bookingId} accepted by pandit ${panditId}`);

    return new SingleBookingResponse(true, "accepted booking");
  }
}
