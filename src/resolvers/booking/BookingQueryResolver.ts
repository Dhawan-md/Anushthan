import { Inject, Service } from "typedi";
import { Arg, Authorized, Ctx, Query, Resolver } from "type-graphql";
import { plainToInstance } from "class-transformer";

import { BookingInfoProvider } from "../../providers/booking/BookingInfoProvider";

import { Context } from "../../types/context";
import { PaginationInput } from "../../types/inputTypes/PaginationInput";
import { MultipleBookingResponse } from "../../types/responses/BookingResponse";
import { MyBookingsDto } from "../../types/dtos/booking";

import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";

@Service()
@Resolver()
export class BookingQueryResolver {
  constructor(
    @Inject(() => BookingInfoProvider)
    private bookingInfoProvider: BookingInfoProvider
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

    return this.bookingInfoProvider.myBookings(dto);
  }
}
