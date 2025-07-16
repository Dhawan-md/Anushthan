import { Service } from "typedi";
import { In, Repository } from "typeorm";

import { Service as ServiceEntity } from "../../entities/Service";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { MultipleServiceResponse } from "../../types/responses/ServiceResponse";
import { GetServicesDto } from "../../types/dtos/Service";

import { validateFoundIds } from "../../utils/validateFoundIds";
import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";

import {
  NO_SERVICE_ID_PROVIDED,
  SERVICE_ALREADY_EXISTS,
  SERVICE_DOES_NOT_BELONG_TO_THIS_CATEGORY,
  SERVICE_IDS_FOUND,
  SERVICE_LIST,
} from "../../utils/messages";

@Service()
export class ServiceInfoProvider {
  private serviceInfoRepository: Repository<ServiceEntity>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.serviceInfoRepository =
      this.repositoryFactory.getRepository(ServiceEntity);
  }

  async checkServiceExists(name: string) {
    logger.info(
      `[ServiceInfoProvider.ts] 🔍 Searching for service with name: ${name}`
    );
    const isExisting = await this.serviceInfoRepository
      .createQueryBuilder("service")
      .where("LOWER(service.name) = :name", { name: name.toLowerCase() })
      .getExists();

    if (isExisting) {
      logger.warn(
        `[ServiceInfoProvider.ts] ⚠️ Service with name "${name}" already exists.`
      );
      throw new CustomError(SERVICE_ALREADY_EXISTS);
    }

    logger.info(
      `[ServiceInfoProvider.ts] ✅ Service name "${name}" is available.`
    );
  }

  async getAllServices(
    params: GetServicesDto
  ): Promise<MultipleServiceResponse> {
    const { page = 1, limit = 10, filters } = params;
    logger.info(
      `[ServiceInfoProvider.ts] 🔄 Fetching services for page ${page} with limit ${limit}`
    );

    // const where: FindOptionsWhere<ServiceEntity> = {};

    // if (filters) {
    //   // category filter
    //   if (filters.categoryId) {
    //     where.category = {
    //       id: filters.categoryId,
    //     };
    //   }

    // Duration filtering
    // if(filters.minDuration && filters.maxDuration){
    //   where.price = Between(filters.minDuration, filters.maxDuration)
    // }else if(filters.minDuration){
    //   where.duration = MoreThanOrEqual(filters.minDuration);
    // }
    // else if(filters.maxDuration){
    //   where.duration = LessThanOrEqual(filters.maxDuration)
    // }

    // Price Filtering
    // if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
    //   where.price = Between(filters.minPrice, filters.maxPrice);
    // } else if (filters.minPrice !== undefined) {
    //   where.price = MoreThanOrEqual(filters.minPrice);
    // } else if (filters.maxPrice !== undefined) {
    //   where.price = LessThanOrEqual(filters.maxPrice);
    // }
    // }
    const [serviceList, total] = await this.serviceInfoRepository.findAndCount({
      where: { category: { id: filters.categoryId } },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `[ServiceInfoProvider.ts] ✅ Retrieved ${serviceList.length} services from the database.`
    );
    return new MultipleServiceResponse(
      true,
      SERVICE_LIST,
      serviceList,
      total,
      page,
      limit,
      totalPages
    );
  }

  async getServices(serviceIds: string[]): Promise<MultipleServiceResponse> {
    logger.info(
      `[ServiceInfoProvider.ts] 📩 Received request to fetch services with IDs: ${serviceIds.join(
        ", "
      )}`
    );

    if (!serviceIds.length) {
      throw new CustomError(NO_SERVICE_ID_PROVIDED);
    }

    const services = await this.serviceInfoRepository.find({
      where: { id: In(serviceIds) },
    });

    if (!services || services.length !== serviceIds.length) {
      logger.warn(
        `[ServiceInfoProvider.ts] ⚠️ Some provided service IDs are invalid. Expected: ${serviceIds.length}, Found: ${services.length}`
      );
      validateFoundIds(services, serviceIds, "Invalid Service Ids");
    }

    logger.info(
      `[ServiceInfoProvider.ts] ✅ Successfully fetched ${services.length} service(s)`
    );
    return new MultipleServiceResponse(true, SERVICE_IDS_FOUND, services);
  }

  async doServicesBelongToCategory(
    serviceIds: string[],
    categoryId: string
  ): Promise<void> {
    logger.info(
      `[ServiceInfoProvider.ts] 📩 Checking if services belong to category ${categoryId}`
    );

    const count = await this.serviceInfoRepository.count({
      where: { id: In(serviceIds), category: { id: categoryId } },
      relations: ["category"],
    });

    // Check if all services exist and belong to the given category
    if (count !== serviceIds.length) {
      logger.warn(
        `[ServiceInfoProvider.ts] ⚠️ Some services do not belong to category ${categoryId}. Expected ${serviceIds.length}, found ${count}.`
      );
      throw new CustomError(SERVICE_DOES_NOT_BELONG_TO_THIS_CATEGORY);
    }

    logger.info(
      `[ServiceInfoProvider.ts] ✅ All services belong to category ${categoryId}`
    );
  }
}
