import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { CategoryInfoProvider } from "./CategoryInfoProvider";

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
    @Inject(() => CategoryInfoProvider)
    private categoryInfoProvider: CategoryInfoProvider
  ) {
    this.categoryActionRepository =
      this.repositoryFactory.getRepository(Category);
  }

  async addCategory(name: string): Promise<SingleCategoryResponse> {
    logger.info(
      `[CategoryActionProvider.ts] 📩 Received request to add new category: ${name}`
    );

    await this.categoryInfoProvider.checkIfCategoryExists(name);

    const category = this.categoryActionRepository.create({ name });

    await this.categoryActionRepository.save(category);

    logger.info(
      `[CategoryActionProvider.ts] ✅ New category added: ${category.name} (ID: ${category.id})`
    );
    return new SingleCategoryResponse(true, CATEGORY_ADDED_SUCCESS, category);
  }
}
