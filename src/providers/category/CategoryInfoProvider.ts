import { Service } from "typedi";
import { In, Repository } from "typeorm";

import { Category } from "../../entities/Category";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { MultipleCategoryResponse } from "../../types/responses/CategoryResponse";
import { PaginationDto } from "../../types/dtos/Pagination";

import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import {
  CATEGORY_ALREADY_EXISTS,
  CATEGORY_IDS_FOUND,
  CATEGORY_LIST,
  CATEGORY_NOT_FOUND,
  NO_CATEGORY_ID_PROVIDED,
} from "../../utils/messages";
import { validateFoundIds } from "../../utils/validateFoundIds";

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

  async getCategories(
    categoryIds: string[]
  ): Promise<MultipleCategoryResponse> {
    logger.info(
      `[CategoryInfoProvider.ts] 📩 Received request to fetch category with IDs: ${categoryIds.join(
        ", "
      )}`
    );

    if (!categoryIds.length) {
      throw new CustomError(NO_CATEGORY_ID_PROVIDED);
    }

    const categories = await this.categoryInfoRepository.find({
      where: { id: In(categoryIds) },
    });

    if (!categories || categories.length !== categoryIds.length) {
      logger.warn(
        `[CategoryInfoProvider.ts] ⚠️ Some provided category IDs are invalid. Expected: ${categoryIds.length}, Found: ${categoryIds.length}`
      );

      validateFoundIds(categories, categoryIds, "Invalid Service Ids");
    }

    logger.info(
      `[ServiceInfoProvider.ts] ✅ Successfully fetched ${categories.length} categories`
    );
    return new MultipleCategoryResponse(true, CATEGORY_IDS_FOUND, categories);
  }
}
