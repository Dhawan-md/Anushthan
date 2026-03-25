import { Inject, Service } from "typedi";
import { Arg, Authorized, Ctx, Query, Resolver } from "type-graphql";
import { plainToInstance } from "class-transformer";

import { PanditDashboardService } from "../../services/pandit/PanditDashboardService";
import { PanditInfoService } from "../../services/pandit/PanditInfoService";
import { BookingInfoService } from "../../services/booking/BookingInfoService";

import { Context } from "../../types/context";
import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { PanditDashboardResponse } from "../../types/responses/PanditDashboardResponse";
import { MultipleBookingResponse } from "../../types/responses/BookingResponse";
import { MultipleNotificationResponse } from "../../types/responses/NotificationResponse";
import { MultipleTransactionResponse } from "../../types/responses/TransactionResponse";
import { MultipleCategoryResponse } from "../../types/responses/CategoryResponse";

import { PaginationInput } from "../../types/inputTypes/PaginationInput";
import { MyBookingsDto } from "../../types/dtos/booking";

import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";
import { UserRole } from "../../utils/enums";
import { Repository } from "typeorm";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { Notification } from "../../entities/Notification";
import { Transaction } from "../../entities/Transaction";

@Service()
@Resolver()
export class PanditQueryResolver {
  private notificationRepository: Repository<Notification>;
  private transactionRepository: Repository<Transaction>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => PanditDashboardService) private panditDashboardService: PanditDashboardService,
    @Inject(() => PanditInfoService) private panditInfoService: PanditInfoService,
    @Inject(() => BookingInfoService) private bookingInfoService: BookingInfoService,
  ) {
    this.notificationRepository = this.repositoryFactory.getRepository(Notification);
    this.transactionRepository = this.repositoryFactory.getRepository(Transaction);
  }

  @Authorized(UserRole.PANDIT)
  @Query(() => PanditDashboardResponse)
  async dashboardAPI(
    @Ctx() ctx: Context
  ): Promise<PanditDashboardResponse> {
    const panditId = ctx.user?.panditId || ctx.user?.id; // Adjust based on token contents
    if (!panditId) throw new CustomError(UNAUTHORIZED);
    
    return this.panditDashboardService.getDashboardStats(panditId);
  }

  @Authorized(UserRole.PANDIT)
  @Query(() => MultipleCategoryResponse)
  async servicesListAPI(
    @Ctx() ctx: Context
  ): Promise<MultipleCategoryResponse> {
    const panditId = ctx.user?.panditId || ctx.user?.id;
    if (!panditId) throw new CustomError(UNAUTHORIZED);
    
    const pandit = await this.panditInfoService.getPandit({ data: { id: panditId }, withCategory: true });
    return new MultipleCategoryResponse(true, "Services fetched successfully", pandit.categories);
  }

  @Authorized(UserRole.PANDIT)
  @Query(() => MultipleBookingResponse)
  async panditBookingsListAPI(
    @Arg("data", () => PaginationInput, { nullable: true }) data: PaginationInput,
    @Ctx() ctx: Context
  ): Promise<MultipleBookingResponse> {
    const panditId = ctx.user?.panditId || ctx.user?.id;
    if (!panditId) throw new CustomError(UNAUTHORIZED);

    const dto: MyBookingsDto = plainToInstance(MyBookingsDto, { ...data, id: panditId });
    return this.bookingInfoService.myBookings(dto);
  }

  @Authorized(UserRole.PANDIT)
  @Query(() => MultipleBookingResponse)
  async bookingHistoryAPI(
    @Arg("data", () => PaginationInput, { nullable: true }) data: PaginationInput,
    @Ctx() ctx: Context
  ): Promise<MultipleBookingResponse> {
    // For now we can fetch using myBookings and client can filter, or pass status inside MyBookingsDto
    // If exact status filter is needed, it must be added to MyBookingsDto.
    const panditId = ctx.user?.panditId || ctx.user?.id;
    if (!panditId) throw new CustomError(UNAUTHORIZED);

    const dto = plainToInstance(MyBookingsDto, { ...data, id: panditId });
    // In actual implementation, we'd add 'status' to MyBookingsDto to get only COMPLETED/CANCELLED
    return this.bookingInfoService.myBookings(dto); 
  }

  @Authorized(UserRole.PANDIT)
  @Query(() => MultipleTransactionResponse)
  async paymentHistoryListAPI(
    @Arg("data", () => PaginationInput, { nullable: true }) data: PaginationInput,
    @Ctx() ctx: Context
  ): Promise<MultipleTransactionResponse> {
    const panditId = ctx.user?.panditId || ctx.user?.id;
    if (!panditId) throw new CustomError(UNAUTHORIZED);
    
    const { page = 1, limit = 10 } = data || {};
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId: panditId, userRole: UserRole.PANDIT },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" }
    });

    const totalPages = Math.ceil(total / limit);
    return new MultipleTransactionResponse(true, "Payment history fetched", transactions, total, page, limit, totalPages);
  }

  @Authorized(UserRole.PANDIT)
  @Query(() => MultipleNotificationResponse)
  async notificationsListAPI(
    @Arg("data", () => PaginationInput, { nullable: true }) data: PaginationInput,
    @Ctx() ctx: Context
  ): Promise<MultipleNotificationResponse> {
    const panditId = ctx.user?.panditId || ctx.user?.id;
    if (!panditId) throw new CustomError(UNAUTHORIZED);
    
    const { page = 1, limit = 10 } = data || {};
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId: panditId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" }
    });

    const totalPages = Math.ceil(total / limit);
    return new MultipleNotificationResponse(true, "Notifications fetched", notifications, total, page, limit, totalPages);
  }

  @Authorized(UserRole.PANDIT)
  @Query(() => SinglePanditResponse)
  async profileDetailAPI(
    @Ctx() ctx: Context
  ): Promise<SinglePanditResponse> {
    const panditId = ctx.user?.panditId || ctx.user?.id;
    if (!panditId) throw new CustomError(UNAUTHORIZED);
    
    const pandit = await this.panditInfoService.getPandit({ data: { id: panditId }, withUser: true, withCategory: true });
    return new SinglePanditResponse(true, "Profile details fetched successfully", pandit);
  }

  @Authorized(UserRole.PANDIT)
  @Query(() => MultipleTransactionResponse)
  async earningsListAPI(
    @Arg("data", () => PaginationInput, { nullable: true }) data: PaginationInput,
    @Ctx() ctx: Context
  ): Promise<MultipleTransactionResponse> {
    return this.paymentHistoryListAPI(data, ctx); // Same for now
  }
}
