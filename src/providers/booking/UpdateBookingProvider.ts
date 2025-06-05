import { Inject, Service } from "typedi";
import { BookingInfoProvider } from "./BookingInfoProvider";
import { Booking } from "../../entities/Booking";
import { EntityManager, Repository } from "typeorm";
import { SingleBookingResponse } from "../../types/responses/BookingResponse";
import { logger } from "../../utils/logger";
import { BOOKING_UPDATED, NO_DATA_TO_UPDATE } from "../../utils/messages";
import { CustomError } from "../../utils/customError";
import { RepositoryFactory } from "../../factories/RepositoryFactory";

@Service()
export class UpdateBookingProvider {
  private updateBookingRepository: Repository<Booking>;
  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => BookingInfoProvider)
    private bookingInfoProvider: BookingInfoProvider
  ) {
    this.updateBookingRepository =
      this.repositoryFactory.getRepository(Booking);
  }

  async updateBooking(
    updatedBookingData: Partial<Booking>,
    bookingId: string,
    manager?: EntityManager
  ): Promise<SingleBookingResponse> {
    logger.info(`🔄 Updating booking with ID: ${bookingId}`);

    if (Object.keys(updatedBookingData).length === 0) {
      logger.warn(`⚠️ No fields provided to update for booking ${bookingId}`);
      throw new CustomError(NO_DATA_TO_UPDATE);
    }

    const em = manager || this.updateBookingRepository.manager;

    const bookingData = await this.bookingInfoProvider.getBookingDetails(
      bookingId
    );

    Object.assign(bookingData, updatedBookingData);

    const updatedBooking = await em.save(Booking, bookingData);

    logger.info(
      `📝 Fields updated for booking ${bookingId}: ${Object.keys(
        updatedBookingData
      ).join(", ")}`
    );
    logger.info(`✅ Successfully updated booking with ID: ${bookingId}`);
    return new SingleBookingResponse(true, BOOKING_UPDATED, updatedBooking);
  }
}
