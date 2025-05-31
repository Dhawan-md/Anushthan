import { Service } from "typedi";
import { Repository } from "typeorm";

import { Booking } from "../../entities/Booking";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";

import { MultipleBookingResponse } from "../../types/responses/BookingResponse";
import { MyBookingsDto } from "../../types/dtos/booking";
import { CustomError } from "../../utils/customError";

@Service()
export class BookingInfoProvider {
  private BookingInfoRepository: Repository<Booking>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.BookingInfoRepository = this.repositoryFactory.getRepository(Booking);
  }

  async myBookings(params: MyBookingsDto): Promise<MultipleBookingResponse> {
    const { id, page = 1, limit = 10 } = params;
    logger.info(
      `📦 Fetching bookings for user/pandit ID: ${id} | Page: ${page}, Limit: ${limit}`
    );

    const [bookingList, total] = await this.BookingInfoRepository.findAndCount({
      where: [{ userId: id }, { panditId: id }],
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `✅ Retrieved ${bookingList.length} bookings out of ${total} total.`
    );

    return new MultipleBookingResponse(
      true,
      "Booking List",
      bookingList,
      total,
      page,
      limit,
      totalPages
    );
  }

  async getBookingDetails(id: string): Promise<Booking> {
    logger.info(`🔍 Fetching booking details for booking ID: ${id}`);

    const bookingDetails = await this.BookingInfoRepository.findOne({
      where: { id },
    });

    if (!bookingDetails) {
      logger.warn(`⚠️ Booking details not found for ID: ${id}`);
      throw new CustomError("missing booking Details");
    }

    logger.info(`✅ Found booking details for ID: ${id}`);

    return bookingDetails;
  }
}
