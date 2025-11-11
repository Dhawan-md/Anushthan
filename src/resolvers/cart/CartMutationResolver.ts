import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { UserRole } from "../../utils/enums";
import { CartInfoProvider } from "../../providers/cart/CartInfoProvider";
import { MultipleCartResponse } from "../../types/responses/CartReponse";
import { CartActionProvider } from "../../providers/cart/CartActionProvider";
import { Context } from "../../types/context";
import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";

@Service()
@Resolver()
export class CartMutationResolver {
  constructor(
    @Inject(() => CartInfoProvider)
    private cartInfoProvider: CartInfoProvider,
    @Inject(() => CartActionProvider)
    private cartActionProvider: CartActionProvider
  ) {}

  @Authorized(UserRole.USER)
  @Mutation(() => MultipleCartResponse)
  async getCart(@Ctx() ctx: Context) {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    return this.cartInfoProvider.getOrCreateCart(userId);
  }

  @Authorized(UserRole.USER)
  @Mutation(() => MultipleCartResponse)
  async clearCart(@Ctx() ctx: Context) {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    return this.cartActionProvider.clearCart(userId);
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

    return this.cartActionProvider.addToCart(userId, serviceIds, categoryId);
  }

  @Authorized(UserRole.USER)
  @Mutation(() => MultipleCartResponse)
  async removeFromCart(
    @Arg("serviceId") serviceId: string,
    @Ctx() ctx: Context
  ) {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    return this.cartActionProvider.removeFromCart(userId, serviceId);
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

    return this.cartActionProvider.syncCart({ userId, serviceIds, categoryId });
  } 
}
