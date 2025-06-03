import { Arg, Authorized, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";
import { plainToInstance } from "class-transformer";

import { CategoryInfoProvider } from "../../providers/category/CategoryInfoProvider";

import { MultipleCategoryResponse } from "../../types/responses/CategoryResponse";
import { PaginationInput } from "../../types/inputTypes/PaginationInput";
import { PaginationDto } from "../../types/dtos/Pagination";
import { AdminRole } from "../../utils/enums";

@Service()
@Resolver()
export class CategoryQueryResolver {
  constructor(
    @Inject(() => CategoryInfoProvider)
    private categoryInfoProvider: CategoryInfoProvider
  ) {}

  @Authorized(AdminRole.USER)
  @Query(() => MultipleCategoryResponse)
  async getAllCategories(@Arg("data") data: PaginationInput) {
    const dto = plainToInstance(PaginationDto, data);

    return this.categoryInfoProvider.getAllCategorys(dto);
  }
}
