// import { Arg, Authorized, Query, Resolver } from "type-graphql";
// import { Inject, Service } from "typedi";

// import { UserRole } from "../../utils/enums";
// import { CartInfoProvider } from "../../providers/cart/CartInfoProvider";
// import { MultipleCartResponse } from "../../types/responses/CartReponse";

// @Service()
// @Resolver()
// export class CartQueryResolver {
//   constructor(
//     @Inject(() => CartInfoProvider)
//     private cartInfoProvider: CartInfoProvider
//   ) {}

//   @Authorized(UserRole.USER)
//   @Query(() => MultipleCartResponse)
//   async getCart(@Arg("userId") userId: string) {
//     return this.cartInfoProvider.getOrCreateCart(userId);
//   }
// }
