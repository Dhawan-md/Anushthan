import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { CategoryInfoService } from "./CategoryInfoService";

import { Category } from "../../entities/Category";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleCategoryResponse } from "../../types/responses/CategoryResponse";

import { logger } from "../../utils/logger";
import { CATEGORY_ADDED_SUCCESS } from "../../utils/messages";

@Service()
export class CategoryActionProvdier {
  private categoryActionRepository: Repository<Category>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => CategoryInfoService)
    private categoryInfoService: CategoryInfoService
  ) {
    this.categoryActionRepository =
      this.repositoryFactory.getRepository(Category);
  }

  async addCategory(name: string): Promise<SingleCategoryResponse> {
    logger.info(
      `[CategoryActionService.ts] 📩 Received request to add new category: ${name}`
    );

    await this.categoryInfoService.checkIfCategoryExists(name);

    const category = this.categoryActionRepository.create({ name });

    await this.categoryActionRepository.save(category);

    logger.info(
      `[CategoryActionService.ts] ✅ New category added: ${category.name} (ID: ${category.id})`
    );
    return new SingleCategoryResponse(true, CATEGORY_ADDED_SUCCESS, category);
  }
}
