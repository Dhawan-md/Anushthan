import { Inject, Service } from "typedi";
import {
  Resolver,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  // Query,
} from "type-graphql";

import { BookingActionProvider } from "../../providers/booking/BookingActionProvider";

import { BookingInput } from "../../types/inputTypes/booking/BookingInputType";
import { Context } from "../../types/context";
import { SingleBookingResponse } from "../../types/responses/BookingResponse";

import { CustomError } from "../../utils/customError";
import {
  UNAUTHORIZED,
  USER_ALREADY_EXISTS,
  USER_ONLY,
} from "../../utils/messages";
import { UserRole } from "../../utils/enums";
import { acceptBookingDto, placeBookingDto } from "../../types/dtos/booking";
import { plainToInstance } from "class-transformer";

@Service()
@Resolver()
export class BookingMutationResolver {
  constructor(
    @Inject(() => BookingActionProvider)
    private bookingActionProvider: BookingActionProvider
  ) {}

  @Authorized("USER")
  @Mutation(() => SingleBookingResponse)
  async placeBooking(
    @Arg("data") data: BookingInput,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId) throw new CustomError(UNAUTHORIZED);
    if (userRole === UserRole.PANDIT) throw new CustomError(USER_ONLY);

    // TODO: push to real-time queue/socket for Pandits to accept
    const dto: placeBookingDto = plainToInstance(placeBookingDto, {
      ...data,
      userId,
    });

    return this.bookingActionProvider.placeBooking(dto);
  }

  @Authorized("PANDIT")
  @Mutation(() => SingleBookingResponse)
  async acceptBooking(
    @Arg("bookingId") bookingId: string,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const panditId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!panditId) throw new CustomError(UNAUTHORIZED);
    if (userRole === UserRole.USER) throw new CustomError(USER_ALREADY_EXISTS);
    
    // TODO: notify user via socket or pubsub
    const dto: acceptBookingDto = plainToInstance(acceptBookingDto, {
      bookingId,
      panditId,
    });

    return this.bookingActionProvider.acceptBooking(dto);
  }
}
