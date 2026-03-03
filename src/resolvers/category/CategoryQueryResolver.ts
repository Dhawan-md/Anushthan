import { Arg, Authorized, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";
import { plainToInstance } from "class-transformer";

import { CategoryInfoService } from "../../services/category/CategoryInfoService";

import { MultipleCategoryResponse } from "../../types/responses/CategoryResponse";
import { PaginationInput } from "../../types/inputTypes/PaginationInput";
import { PaginationDto } from "../../types/dtos/Pagination";

import { UserRole } from "../../utils/enums";

@Service()
@Resolver()
export class CategoryQueryResolver {
  constructor(
    @Inject(() => CategoryInfoService)
    private categoryInfoService: CategoryInfoService
  ) {}

  @Authorized(UserRole.USER)
  @Query(() => MultipleCategoryResponse)
  async getAllCategories(@Arg("data") data: PaginationInput) {
    const dto = plainToInstance(PaginationDto, data);

    return this.categoryInfoService.getAllCategories(dto);
  }
}
