import { Service } from "typedi";
import { Repository } from "typeorm";

import { Category } from "../../entities/Category";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { MultipleCategoryResponse } from "../../types/responses/CategoryResponse";
import { PaginationDto } from "../../types/dtos/Pagination";

import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import {
  CATEGORY_ALREADY_EXISTS,
  CATEGORY_LIST,
  CATEGORY_NOT_FOUND,
} from "../../utils/messages";

@Service()
export class CategoryInfoProvider {
  private categoryInfoRepository: Repository<Category>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.categoryInfoRepository =
      this.repositoryFactory.getRepository(Category);
  }

  async checkIfCategoryExists(name: string) {
    logger.info(
      `[CategoryInfoProvider.ts] 🔍 Searching for category with name: ${name}`
    );
    const isExisting = await this.categoryInfoRepository
      .createQueryBuilder("category")
      .where("LOWER(category.name) = :name", { name: name.toLowerCase() })
      .getExists();

    if (isExisting) {
      logger.warn(
        `[CategoryInfoProvider.ts] ⚠️ Category with name "${name}" already exists.`
      );
      throw new CustomError(CATEGORY_ALREADY_EXISTS);
    }
  }

  async getAllCategories(
    params: PaginationDto
  ): Promise<MultipleCategoryResponse> {
    const { page = 1, limit = 10 } = params;
    logger.info(
      `[CategoryInfoProvider.ts] 🔄 Fetching categorys for page ${page} with limit ${limit}`
    );

    const [categoryList, total] =
      await this.categoryInfoRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
      });

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `[CategoryInfoProvider.ts] ✅ Retrieved ${categoryList.length} categorys from the database.`
    );
    return new MultipleCategoryResponse(
      true,
      CATEGORY_LIST,
      categoryList,
      total,
      page,
      limit,
      totalPages
    );
  }

  async getCategoryDetails(categoryId: string): Promise<Category> {
    logger.info(
      `[CategoryInfoProvider.ts] 📩 Received request to fetch category with ID: ${categoryId}`
    );

    const categoryDetails = await this.categoryInfoRepository.findOne({
      where: { id: categoryId },
    });

    if (!categoryDetails) {
      logger.warn(
        `[CategoryInfoProvider.ts] ⚠️ Category details not found for ID: ${categoryId}`
      );
      throw new CustomError(CATEGORY_NOT_FOUND);
    }

    logger.info(
      `[CategoryInfoProvider.ts] ✅ Found category details for ID: ${categoryId}`
    );

    return categoryDetails;
  }
}
