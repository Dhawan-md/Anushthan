import { Inject, Service } from "typedi";
import { Arg, Authorized, Ctx, Query, Resolver } from "type-graphql";
import { plainToInstance } from "class-transformer";

import { BookingInfoService } from "../../services/booking/BookingInfoService";

import { Context } from "../../types/context";
import { PaginationInput } from "../../types/inputTypes/PaginationInput";
import { MultipleBookingResponse, SingleBookingResponse } from "../../types/responses/BookingResponse";
import { MyBookingsDto } from "../../types/dtos/booking";

import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";

@Service()
@Resolver()
export class BookingQueryResolver {
  constructor(
    @Inject(() => BookingInfoService)
    private bookingInfoService: BookingInfoService
  ) {}

  @Authorized()
  @Query(() => MultipleBookingResponse)
  async myBookings(
    @Arg("data", () => PaginationInput, { nullable: true })
    data: PaginationInput,
    @Ctx() ctx: Context
  ): Promise<MultipleBookingResponse> {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    const dto: MyBookingsDto = plainToInstance(MyBookingsDto, {
      ...data,
      id: userId,
    });

    return this.bookingInfoService.myBookings(dto);
  }

  @Authorized()
  @Query(() => SingleBookingResponse)
  async bookingDetailsAPI(
    @Arg("bookingId") bookingId: string,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const userId = ctx.user?.id || ctx.user?.panditId;
    if (!userId) throw new CustomError(UNAUTHORIZED);

    const booking = await this.bookingInfoService.getBookingDetails({ bookingId });
    
    // Check if the user/pandit actually owns this booking
    if (booking.userId !== userId && booking.panditId !== userId) {
      throw new CustomError("You do not have permission to view this booking.");
    }

    return new SingleBookingResponse(true, "Booking details fetched successfully", booking);
  }
}
