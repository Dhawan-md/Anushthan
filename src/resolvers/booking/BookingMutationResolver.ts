import { Inject, Service } from "typedi";
import { Resolver, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { plainToInstance } from "class-transformer";

import { BookingActionProvider } from "../../providers/booking/BookingActionProvider";

import { PlaceBookingInput } from "../../types/inputTypes/booking/PlaceBookingInputType";
import { Context } from "../../types/context";
import { SingleBookingResponse } from "../../types/responses/BookingResponse";

import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";
import { UserRole } from "../../utils/enums";
import {
  AcceptBookingDto,
  CancelPanditBookingDto,
  CancelUserBookingDto,
  PlaceBookingDto,
} from "../../types/dtos/Booking";
import { CancelBookingInput } from "../../types/inputTypes/booking/CancelUserBooking";

@Service()
@Resolver()
export class BookingMutationResolver {
  constructor(
    @Inject(() => BookingActionProvider)
    private bookingActionProvider: BookingActionProvider
  ) {}

  @Authorized(UserRole.USER)
  @Mutation(() => SingleBookingResponse)
  async placeBooking(
    @Arg("data") data: PlaceBookingInput,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    // TODO: push to real-time queue/socket for Pandits to accept
    const dto: PlaceBookingDto = plainToInstance(PlaceBookingDto, {
      ...data,
      userId,
    });

    return this.bookingActionProvider.placeBooking(dto);
  }

  @Mutation(() => SingleBookingResponse)
  @Authorized(UserRole.PANDIT)
  async acceptBooking(
    @Arg("bookingId") bookingId: string,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const panditId = ctx.user?.id;

    if (!panditId) throw new CustomError(UNAUTHORIZED);

    // TODO: notify user via socket or pubsub
    const dto: AcceptBookingDto = plainToInstance(AcceptBookingDto, {
      bookingId,
      panditId,
    });

    return this.bookingActionProvider.acceptBooking(dto);
  }

  @Mutation(() => SingleBookingResponse)
  @Authorized(UserRole.PANDIT)
  async cancelBookingPandit(
    @Arg("data") data: CancelBookingInput,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const panditId = ctx.user?.id;

    if (!panditId) throw new CustomError(UNAUTHORIZED);

    // TODO: notify user via socket or pubsub
    const dto: CancelPanditBookingDto = plainToInstance(
      CancelPanditBookingDto,
      {
        ...data,
        panditId,
      }
    );

    return this.bookingActionProvider.cancelBookingByPandit(dto);
  }

  @Mutation(() => SingleBookingResponse)
  @Authorized(UserRole.USER)
  async cancelBookingUser(
    @Arg("data") data: CancelBookingInput,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    // TODO: notify user via socket or pubsub
    const dto: CancelUserBookingDto = plainToInstance(CancelUserBookingDto, {
      ...data,
      userId,
    });

    return this.bookingActionProvider.cancelBookingByUser(dto);
  }
}
