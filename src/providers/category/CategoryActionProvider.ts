import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { Category } from "../../entities/Category";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { SingleCategoryResponse } from "../../types/responses/CategoryResponse";
import { logger } from "../../utils/logger";
import { CategoryInfoProvider } from "./CategoryInfoProvider";
import { CATEGORY_ADDED_SUCCESS } from "../../utils/messages";

@Service()
export class CategoryActionProvier {
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
    logger.info(`📩 Received request to add new category: ${name}`);

    await this.categoryInfoProvider.checkCategoryExists(name);

    const category = this.categoryActionRepository.create({ name });

    await this.categoryActionRepository.save(category);

    logger.info(`✅ New category added: ${category.name} (ID: ${category.id})`);
    return new SingleCategoryResponse(true, CATEGORY_ADDED_SUCCESS, category);
  }
}
