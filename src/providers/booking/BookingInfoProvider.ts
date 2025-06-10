import { Service } from "typedi";
import { Repository } from "typeorm";
import isEqual from "lodash/isEqual";

import { Booking } from "../../entities/Booking";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";

import { MultipleBookingResponse } from "../../types/responses/BookingResponse";
import { MyBookingsDto, PlaceBookingDto } from "../../types/dtos/booking";
import { CustomError } from "../../utils/customError";
import { BookingStatus } from "../../utils/enums";

@Service()
export class BookingInfoProvider {
  private bookingInfoRepository: Repository<Booking>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.bookingInfoRepository = this.repositoryFactory.getRepository(Booking);
  }

  async myBookings(params: MyBookingsDto): Promise<MultipleBookingResponse> {
    const { id, page = 1, limit = 10 } = params;
    logger.info(
      `📦 Fetching bookings for user/pandit ID: ${id} | Page: ${page}, Limit: ${limit}`
    );

    const [bookingList, total] = await this.bookingInfoRepository.findAndCount({
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

    const bookingDetails = await this.bookingInfoRepository.findOne({
      where: { id },
    });

    if (!bookingDetails) {
      logger.warn(`⚠️ Booking details not found for ID: ${id}`);
      throw new CustomError("missing booking Details");
    }

    logger.info(`✅ Found booking details for ID: ${id}`);

    return bookingDetails;
  }

  async isDuplicateBooking(params: PlaceBookingDto): Promise<boolean> {
    logger.info(
      `🔍 Checking for duplicate booking for userId: ${params.userId}`
    );

    if (!params.serviceIds || params.serviceIds.length === 0) {
      logger.warn(`⚠️ No serviceIds provided for duplicate check.`);
      throw new CustomError("No serviceIds provided for duplicate check.");
    }

    const possibleConflicts = await this.bookingInfoRepository.find({
      where: {
        userId: params.userId,
        timeSlot: params.timeSlot,
        status: BookingStatus.PENDING,
      },
    });

    logger.info(
      `📋 Found ${possibleConflicts.length} existing pending bookings at the same time.`
    );

    const sortedInputIds = [...params.serviceIds].sort();

    const hasDuplicate = possibleConflicts.some((b) => {
      const existingIds = [...(b.serviceIds || [])].sort();
      const isMatch = isEqual(existingIds, sortedInputIds);
      if (isMatch) {
        logger.info(
          `⚠️ Duplicate booking found with serviceIds: ${existingIds}`
        );
      }
      return isMatch;
    });

    return hasDuplicate;
  }

  async isPendingAmount(userId: string): Promise<void> {
    logger.info(
      `🔍 Checking if their is some pending amount from previous bookings`
    );

    const booking = await this.bookingInfoRepository.findOne({
      where: { userId, paid: false },
    });
    if (!!booking) {
      throw new CustomError(
        `An amount of ${booking.totalPrice} is pending from your previous booking with booking Id: ${booking.id}. Go to orders and clear the due before placing a new booking.`
      );
    }
  }
}
