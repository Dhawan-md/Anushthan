import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { Cart } from "../../entities/Cart";
import { UserInfoProvider } from "../user/UserInfoProvider";
import { MultipleCartResponse } from "../../types/responses/CartReponse";
import { logger } from "../../utils/logger";
import { generateSignedUrl } from "../../helpers/generateSignedUrl";
import { S3BucketType } from "../../utils/enums";

@Service()
export class CartInfoProvider {
  private cartRepository: Repository<Cart>;

  constructor(
    private repositoryFactory: RepositoryFactory,

    @Inject(() => UserInfoProvider)
    private userInfoProvider: UserInfoProvider
  ) {
    this.cartRepository = this.repositoryFactory.getRepository(Cart);
  }

  /**
   * ✅ Get or create a user's cart
   */
  async getOrCreateCart(userId: string): Promise<MultipleCartResponse> {
    // 🔹 Try to find an existing cart
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ["services"],
    });

    // 🔹 If no cart exists, create one
    if (!cart) {
      const user = await this.userInfoProvider.getUser({ id: userId });

      cart = this.cartRepository.create({
        user,
        services: [],
        totalPrice: 0,
        categoryId: null,
      });

      await this.cartRepository.save(cart);
    }

    // 🔹 Only if there are services, generate signed URLs
    if (cart.services && cart.services.length > 0) {
      const servicesWithUrls = await Promise.all(
        cart.services.map(async (service) => {
          try {
            const signedUrl = await generateSignedUrl(
              service.imagePath,
              S3BucketType.IMAGE
            );
            return {
              ...service,
              imageUrl: signedUrl, // ⬅️ add it here properly
            };
          } catch (err) {
            logger.warn(
              `⚠️ Failed to generate signed URL for ${service.id}`,
              err
            );
            return service;
          }
        })
      );

      // 🔹 Attach back to the cart
      (cart as any).services = servicesWithUrls;
    }

    // 🔹 Return consistent response
    return new MultipleCartResponse(true, "Cart retrieved successfully", cart);
  }
}
