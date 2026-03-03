import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { UserRole } from "../../utils/enums";
import { CartInfoService } from "../../services/cart/CartInfoService";
import { MultipleCartResponse } from "../../types/responses/CartReponse";
import { CartActionService } from "../../services/cart/CartActionService";
import { Context } from "../../types/context";
import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";

@Service()
@Resolver()
export class CartMutationResolver {
  constructor(
    @Inject(() => CartInfoService)
    private cartInfoService: CartInfoService,
    @Inject(() => CartActionService)
    private cartActionService: CartActionService
  ) {}

  @Authorized(UserRole.USER)
  @Mutation(() => MultipleCartResponse)
  async getCart(@Ctx() ctx: Context) {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    return this.cartInfoService.getOrCreateCart(userId);
  }

  @Authorized(UserRole.USER)
  @Mutation(() => MultipleCartResponse)
  async clearCart(@Ctx() ctx: Context) {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    return this.cartActionService.clearCart(userId);
  }

  @Authorized(UserRole.USER)
  @Mutation(() => MultipleCartResponse)
  async addToCart(
    @Arg("serviceIds", () => [String]) serviceIds: string[],
    @Arg("categoryId") categoryId: string,
    @Ctx() ctx: Context
  ) {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    return this.cartActionService.addToCart(userId, serviceIds, categoryId);
  }

  @Authorized(UserRole.USER)
  @Mutation(() => MultipleCartResponse)
  async removeFromCart(
    @Arg("serviceId") serviceId: string,
    @Ctx() ctx: Context
  ) {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    return this.cartActionService.removeFromCart(userId, serviceId);
  }

  @Authorized(UserRole.USER)
  @Mutation(() => MultipleCartResponse)
  async syncCart(
    @Arg("serviceIds", () => [String]) serviceIds: string[],
    @Arg("categoryId") categoryId: string,
    @Ctx() ctx: Context
  ): Promise<MultipleCartResponse> {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    return this.cartActionService.syncCart({ userId, serviceIds, categoryId });
  } 
}
