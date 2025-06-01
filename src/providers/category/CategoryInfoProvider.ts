import { Service } from "typedi";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { Repository } from "typeorm";

import { Category } from "../../entities/Category";

import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { CATEGORY_ALREADY_EXISTS } from "../../utils/messages";

@Service()
export class CategoryInfoProvider {
  private categoryInfoRepository: Repository<Category>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.categoryInfoRepository =
      this.repositoryFactory.getRepository(Category);
  }

  async checkCategoryExists(name: string) {
    logger.info(`🔍 Searching for category with name: ${name}`);
    const isExisting = await this.categoryInfoRepository
      .createQueryBuilder("category")
      .where("LOWER(category.name) = :name", { name: name.toLowerCase() })
      .getExists();

    if (isExisting) {
      logger.warn(`⚠️ Category with name "${name}" already exists.`);
      throw new CustomError(CATEGORY_ALREADY_EXISTS);
    }
  }

  async getCategoryDetails(categoryId: string): Promise<Category> {
    logger.info(`📩 Received request to fetch category with ID: ${categoryId}`);

    const categoryDetails = await this.categoryInfoRepository.findOne({
      where: { id: categoryId },
    });

    if (!categoryDetails) {
      logger.warn(`⚠️ Category details not found for ID: ${categoryId}`);
      throw new CustomError("missing category Details");
    }

    logger.info(`✅ Found category details for ID: ${categoryId}`);

    return categoryDetails;
  }
}
