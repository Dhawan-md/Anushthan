import { Inject, Service } from "typedi";
import { Resolver, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { plainToInstance } from "class-transformer";

import { BookingActionService } from "../../services/booking/BookingActionService";

import { PlaceBookingInput } from "../../types/inputTypes/booking/PlaceBookingInputType";
import { Context } from "../../types/context";
import { SingleBookingResponse } from "../../types/responses/BookingResponse";
import {
  AcceptBookingDto,
  CancelPanditBookingDto,
  CancelUserBookingDto,
  PlaceBookingDto,
} from "../../types/dtos/booking";
import {
  CancelPanditBookingInput,
  CancelUserBookingInput,
} from "../../types/inputTypes/booking/CancelUserBooking";

import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";
import { UserRole } from "../../utils/enums";

@Service()
@Resolver()
export class BookingMutationResolver {
  constructor(
    @Inject(() => BookingActionService)
    private bookingActionService: BookingActionService
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

    return this.bookingActionService.placeBooking(dto);
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

    return this.bookingActionService.acceptBooking(dto);
  }

  @Mutation(() => SingleBookingResponse)
  @Authorized(UserRole.PANDIT)
  async initiateStartBooking(
    @Arg("bookingId") bookingId: string,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const panditId = ctx.user?.id;

    if (!panditId) throw new CustomError(UNAUTHORIZED);

    return this.bookingActionService.initiateStartBooking(bookingId, panditId);
  }

  @Mutation(() => SingleBookingResponse)
  @Authorized(UserRole.PANDIT)
  async finalizeStartBooking(
    @Arg("bookingId") bookingId: string,
    @Arg("otpCode") otpCode: string,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const panditId = ctx.user?.id;

    if (!panditId) throw new CustomError(UNAUTHORIZED);

    return this.bookingActionService.finalizeStartBooking(
      bookingId,
      panditId,
      otpCode
    );
  }

  @Mutation(() => SingleBookingResponse)
  @Authorized(UserRole.PANDIT)
  async cancelBookingPandit(
    @Arg("data") data: CancelPanditBookingInput,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const panditId = ctx.user?.id;

    if (!panditId) throw new CustomError(UNAUTHORIZED);

    const dto: CancelPanditBookingDto = plainToInstance(
      CancelPanditBookingDto,
      {
        ...data,
        panditId,
      }
    );

    return this.bookingActionService.cancelBookingByPandit(dto);
  }

  @Mutation(() => SingleBookingResponse)
  @Authorized(UserRole.USER)
  async cancelBookingUser(
    @Arg("data") data: CancelUserBookingInput,
    @Ctx() ctx: Context
  ): Promise<SingleBookingResponse> {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    const dto: CancelUserBookingDto = plainToInstance(CancelUserBookingDto, {
      ...data,
      userId,
    });

    return this.bookingActionService.cancelBookingByUser(dto);
  }
}
