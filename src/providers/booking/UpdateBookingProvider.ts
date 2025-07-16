import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { BookingInfoProvider } from "./BookingInfoProvider";

import { Booking } from "../../entities/Booking";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";

import { SingleBookingResponse } from "../../types/responses/BookingResponse";

import { CustomError } from "../../utils/customError";

import { BOOKING_UPDATED, NO_DATA_TO_UPDATE } from "../../utils/messages";

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

  async updateBooking(params: {
    updatedBookingData: Partial<Booking>;
    bookingId: string;
    manager?: EntityManager;
  }): Promise<SingleBookingResponse> {
    const { bookingId, manager, updatedBookingData } = params;
    logger.info(`🔄 Updating booking with ID: ${bookingId}`);

    if (Object.keys(updatedBookingData).length === 0) {
      logger.warn(`⚠️ No fields provided to update for booking ${bookingId}`);
      throw new CustomError(NO_DATA_TO_UPDATE);
    }

    const em = manager || this.updateBookingRepository.manager;
    const repo = em.getRepository(Booking);

    const bookingData = await this.bookingInfoProvider.getBookingDetails({
      bookingId,
    });

    const mergedBooking = repo.merge(bookingData, updatedBookingData);
    const updatedBooking = await repo.save(mergedBooking);

    logger.info(
      `📝 Fields updated for booking ${bookingId}: ${Object.keys(
        updatedBookingData
      ).join(", ")}`
    );

    logger.info(`✅ Successfully updated booking with ID: ${bookingId}`);
    
    return new SingleBookingResponse(true, BOOKING_UPDATED, updatedBooking);
  }
}
