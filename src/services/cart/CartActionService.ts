import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { ServiceInfoService } from "../service/ServiceInfoService";
import { CustomError } from "../../utils/customError";
import { Cart } from "../../entities/Cart";
import { CartInfoService } from "./CartInfoService";
import { MultipleCartResponse } from "../../types/responses/CartReponse";

@Service()
export class CartActionService {
  private cartRepository: Repository<Cart>;

  constructor(
    private repositoryFactory: RepositoryFactory,

    @Inject(() => ServiceInfoService)
    private serviceInfoService: ServiceInfoService,
    @Inject(() => CartInfoService)
    private cartInfoService: CartInfoService
  ) {
    this.cartRepository = this.repositoryFactory.getRepository(Cart);
  }

  /**
   * 🛒 Add services to cart
   */
  async addToCart(
    userId: string,
    serviceIds: string[],
    categoryId: string
  ): Promise<MultipleCartResponse> {
    // Fetch and validate services
    const { data } = await this.serviceInfoService.getServices(
      serviceIds,
      categoryId
    );

    const cart = await this.cartInfoService.getOrCreateCart(userId);

    if (!data) {
      throw new CustomError("No services found");
    }

    if (!cart.data) {
      throw new CustomError("Cart not found");
    }

    // Avoid duplicates
    const existingServiceIds = new Set(cart.data.services.map((s) => s.id));
    const newServices = data?.filter((s) => !existingServiceIds.has(s.id));

    if (newServices.length === 0) {
      return new MultipleCartResponse(
        true,
        "No new service added to the cart",
        cart.data
      );
    }

    // Add new services and update totals
    cart.data.services = [...cart.data.services, ...newServices];
    cart.data.categoryId = categoryId;
    cart.data.totalPrice = cart.data.services.reduce(
      (sum, s) => sum + s.price,
      0
    );

    const updatedCart = await this.cartRepository.save(cart.data);
    return new MultipleCartResponse(
      true,
      "Services added to cart successfully",
      updatedCart
    );
  }

  /**
   * ❌ Remove a service from cart
   */

  async removeFromCart(
    userId: string,
    serviceId: string
  ): Promise<MultipleCartResponse> {
    const cart = await this.cartInfoService.getOrCreateCart(userId);

    if (!cart.data) {
      throw new CustomError("Cart not found");
    }

    const existing = cart.data.services.find((s) => s.id === serviceId);

    if (!existing)
      return new MultipleCartResponse(
        true,
        "No service found in the cart",
        cart.data
      );

    cart.data.services = cart.data.services.filter((s) => s.id !== serviceId);
    cart.data.totalPrice -= existing.price;

    // Reset category if cart is empty
    if (cart.data.services.length === 0) {
      cart.data.categoryId = null;
      cart.data.totalPrice = 0;
    }

    await this.cartRepository.save(cart.data);

    return new MultipleCartResponse(
      true,
      "service removed from cart successfully",
      cart.data
    );
  }

  /**
   * 🧹 Clear cart completely
   */
  async clearCart(userId: string): Promise<MultipleCartResponse> {
    const cart = await this.cartInfoService.getOrCreateCart(userId);

    if (!cart.data) {
      throw new CustomError("Cart not found");
    }

    cart.data.services = [];
    cart.data.categoryId = "";
    cart.data.totalPrice = 0;
    await this.cartRepository.save(cart.data);

    return new MultipleCartResponse(true, "Cart cleared successfully");
  }

  async syncCart(data: {
    userId: string;
    serviceIds: string[];
    categoryId: string;
  }): Promise<MultipleCartResponse> {
    const { userId, serviceIds, categoryId } = data;
    // 🔹 1. Fetch service details by IDs
    const { data: services } = await this.serviceInfoService.getServices(
      serviceIds,
      categoryId
    );
    console.log(categoryId);

    if (!services || services.length === 0) {
      throw new CustomError("No services found");
    }

    // 🔹 2. Get or create the user's cart
    const cartResponse = await this.cartInfoService.getOrCreateCart(userId);
    const cart = cartResponse.data;

    if (!cart) {
      throw new CustomError("Cart not found");
    }

    // 🔹 3. Current services already in DB
    const existingServiceIds = new Set(cart.services.map((s) => s.id));

    // 🔹 4. Filter out new services (those not already in the cart)
    const newServices = services.filter((s) => !existingServiceIds.has(s.id));

    // 🔹 5. Remove services that are no longer present in the new list
    cart.services = cart.services.filter((s) => serviceIds.includes(s.id));

    // 🔹 6. Add the new services to the cart
    cart.services.push(...newServices);

    // 🔹 7. Update total price
    cart.totalPrice = cart.services.reduce((sum, s) => sum + s.price, 0);

    cart.categoryId = categoryId;

    // 🔹 8. Save updated cart
    await this.cartRepository.save(cart);

    return new MultipleCartResponse(true, "Cart synced successfully", cart);
  }
}
