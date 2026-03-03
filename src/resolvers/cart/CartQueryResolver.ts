// import { Arg, Authorized, Query, Resolver } from "type-graphql";
// import { Inject, Service } from "typedi";

// import { UserRole } from "../../utils/enums";
// import { CartInfoService } from "../../services/cart/CartInfoService";
// import { MultipleCartResponse } from "../../types/responses/CartReponse";

// @Service()
// @Resolver()
// export class CartQueryResolver {
//   constructor(
//     @Inject(() => CartInfoService)
//     private cartInfoService: CartInfoService
//   ) {}

//   @Authorized(UserRole.USER)
//   @Query(() => MultipleCartResponse)
//   async getCart(@Arg("userId") userId: string) {
//     return this.cartInfoService.getOrCreateCart(userId);
//   }
// }
