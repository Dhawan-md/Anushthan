import { Service } from "typedi";
import { FindOptionsWhere, In, Repository } from "typeorm";
import isEqual from "lodash/isEqual";

import { Booking } from "../../entities/Booking";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";

import { MultipleBookingResponse } from "../../types/responses/BookingResponse";

import { MyBookingsDto, PlaceBookingDto } from "../../types/dtos/booking";
import { BookingFilters } from "../../types/globalTypes";

import { CustomError } from "../../utils/customError";
import { BookingStatus } from "../../utils/enums";
import { PANDIT_LIST } from "../../utils/messages";

@Service()
export class BookingInfoService {
  private bookingInfoRepository: Repository<Booking>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.bookingInfoRepository = this.repositoryFactory.getRepository(Booking);
  }

  async myBookings(params: MyBookingsDto): Promise<MultipleBookingResponse> {
    const { id, page = 1, limit = 10 } = params;
    logger.info(
      `[bookingInfoService.ts] 📦 Fetching bookings for user/pandit ID: ${id} | Page: ${page}, Limit: ${limit}`
    );

    const [bookingList, total] = await this.bookingInfoRepository.findAndCount({
      where: [{ userId: id }, { panditId: id }],
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `[bookingInfoService.ts] ✅ Retrieved ${bookingList.length} bookings out of ${total} total.`
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
      `[bookingInfoService.ts] 🔍 Fetching booking details for ID: ${bookingId} with filters: ${JSON.stringify(
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
        `[bookingInfoService.ts] ⚠️ Booking details not found for ID: ${bookingId}`
      );
      throw new CustomError(`Booking not found for ID: ${bookingId}`);
    }

    logger.info(
      `[bookingInfoService.ts] ✅ Found booking details for ID: ${bookingId}`
    );

    return bookingDetails;
  }

  async isDuplicateBooking(params: PlaceBookingDto): Promise<boolean> {
    logger.info(
      `[bookingInfoService.ts] 🔍 Checking for duplicate booking for userId: ${params.userId}`
    );

    if (!params.serviceIds || params.serviceIds.length === 0) {
      logger.warn(
        `[bookingInfoService.ts] ⚠️ No serviceIds provided for duplicate check.`
      );
      throw new CustomError("No serviceIds provided for duplicate check.");
    }

    const possibleConflicts = await this.bookingInfoRepository.find({
      where: {
        userId: params.userId,
        timeSlotId: params.timeSlotId,
        bookingDate: params.bookingDate,
        status: BookingStatus.PENDING,
      },
    });

    logger.info(
      `[bookingInfoService.ts] 📋 Found ${possibleConflicts.length} existing pending bookings at the same time.`
    );

    const sortedInputIds = [...params.serviceIds].sort();

    const hasDuplicate = possibleConflicts.some((b) => {
      const existingIds = [...(b.serviceIds || [])].sort();
      const isMatch = isEqual(existingIds, sortedInputIds);
      if (isMatch) {
        logger.info(
          `[bookingInfoService.ts] ⚠️ Duplicate booking found with serviceIds: ${existingIds}`
        );
      }
      return isMatch;
    });

    return hasDuplicate;
  }

  async isPendingAmount(userId: string): Promise<void> {
    logger.info(
      `[bookingInfoService.ts] 🔍 Checking if their is some pending amount from previous bookings`
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

  async getAllBusyPandits(
    ids: string[],
    filters?: { timeSlotId: string; bookingDate: Date }
  ): Promise<MultipleBookingResponse> {
    logger.info(
      `[bookingInfoService.ts] 📦 Fetching pandits with active bookings`
    );

    const where = this.buildBookingWhere(ids, filters);

    const panditList = await this.bookingInfoRepository.find({
      where,
      select: { panditId: true },
    });

    logger.info(
      `[bookingInfoService.ts] ✅ Retrieved ${panditList.length} bookings.`
    );

    return new MultipleBookingResponse(true, PANDIT_LIST, panditList);
  }

  async isPanditBusy(params: {
    id: string;
    filters?: { timeSlotId: string; bookingDate: Date };
  }): Promise<Boolean> {
    const { id, filters } = params;
    logger.info(`[bookingInfoService.ts] 📦 Checking if pandit is busy.`);

    const where = this.buildBookingWhere(id, filters);

    const isBusy = await this.bookingInfoRepository.exists({
      where,
    });

    if (isBusy) {
      logger.info(
        `[bookingInfoService.ts] ✅ Pandit does have an active booking.`
      );
    } else {
      logger.info(
        `[bookingInfoService.ts] ✅ Pandit does not have any active bookings for the given parameters.`
      );
    }

    return isBusy;
  }

  private buildBookingWhere(
    panditIds: string[] | string,
    filters?: { timeSlotId: string; bookingDate: Date }
  ): FindOptionsWhere<Booking> {
    const where: FindOptionsWhere<Booking> = {
      panditId: Array.isArray(panditIds) ? In(panditIds) : panditIds,
      status: BookingStatus.ACCEPTED,
    };

    if (filters?.timeSlotId) where.timeSlotId = filters.timeSlotId;
    if (filters?.bookingDate) where.bookingDate = filters.bookingDate;

    return where;
  }
}
