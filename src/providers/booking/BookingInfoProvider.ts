import { Service } from "typedi";
import { FindOptionsWhere, Repository } from "typeorm";
import isEqual from "lodash/isEqual";

import { Booking } from "../../entities/Booking";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";

import { MultipleBookingResponse } from "../../types/responses/BookingResponse";

import { MyBookingsDto, PlaceBookingDto } from "../../types/dtos/booking";
import { BookingFilters } from "../../types/globalTypes";

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
      `[bookingInfoProvider.ts] 📦 Fetching bookings for user/pandit ID: ${id} | Page: ${page}, Limit: ${limit}`
    );

    const [bookingList, total] = await this.bookingInfoRepository.findAndCount({
      where: [{ userId: id }, { panditId: id }],
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `[bookingInfoProvider.ts] ✅ Retrieved ${bookingList.length} bookings out of ${total} total.`
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

  async getBookingDetails(params: {
    bookingId: string;
    filters?: BookingFilters;
  }): Promise<Booking> {
    const { bookingId, filters = {} } = params;
    logger.info(
      `[bookingInfoProvider.ts] 🔍 Fetching booking details for ID: ${bookingId} with filters: ${JSON.stringify(
        filters
      )}`
    );

    const where: FindOptionsWhere<Booking> = {
      id: bookingId,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.panditId && { panditId: filters.panditId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.location && { location: filters.location }),
      ...(filters.status && { status: filters.status }),
      ...(filters.paid !== undefined && { paid: filters.paid }),
      ...(filters.paymentType && { paymentType: filters.paymentType }),
      ...(filters.timeSlot && { timeSlot: filters.timeSlot }),
      ...(filters.completedAt && { completedAt: filters.completedAt }),
      ...(filters.cancelledAt && { cancelledAt: filters.cancelledAt }),
    };

    const bookingDetails = await this.bookingInfoRepository.findOneBy(where);

    if (!bookingDetails) {
      logger.warn(
        `[bookingInfoProvider.ts] ⚠️ Booking details not found for ID: ${bookingId}`
      );
      throw new CustomError(`Booking not found for ID: ${bookingId}`);
    }

    logger.info(
      `[bookingInfoProvider.ts] ✅ Found booking details for ID: ${bookingId}`
    );

    return bookingDetails;
  }

  async isDuplicateBooking(params: PlaceBookingDto): Promise<boolean> {
    logger.info(
      `[bookingInfoProvider.ts] 🔍 Checking for duplicate booking for userId: ${params.userId}`
    );

    if (!params.serviceIds || params.serviceIds.length === 0) {
      logger.warn(
        `[bookingInfoProvider.ts] ⚠️ No serviceIds provided for duplicate check.`
      );
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
      `[bookingInfoProvider.ts] 📋 Found ${possibleConflicts.length} existing pending bookings at the same time.`
    );

    const sortedInputIds = [...params.serviceIds].sort();

    const hasDuplicate = possibleConflicts.some((b) => {
      const existingIds = [...(b.serviceIds || [])].sort();
      const isMatch = isEqual(existingIds, sortedInputIds);
      if (isMatch) {
        logger.info(
          `[bookingInfoProvider.ts] ⚠️ Duplicate booking found with serviceIds: ${existingIds}`
        );
      }
      return isMatch;
    });

    return hasDuplicate;
  }

  async isPendingAmount(userId: string): Promise<void> {
    logger.info(
      `[bookingInfoProvider.ts] 🔍 Checking if their is some pending amount from previous bookings`
    );

    const booking = await this.bookingInfoRepository.findOne({
      where: {
        userId,
        status: BookingStatus.CANCELLED,
        cancelled_booking: {
          isPenaltyApplied: true,
        },
      },
      relations: ["cancelled_booking"],
      order: {
        createdAt: "DESC", // or use cancelled_booking.createdAt if more accurate
      },
    });

    if (!!booking) {
      throw new CustomError(
        `You have a pending penalty of ₹${booking.cancelled_booking.amount} from booking #${booking.id}. Please clear the due before placing a new booking.`
      );
    }
  }
}
