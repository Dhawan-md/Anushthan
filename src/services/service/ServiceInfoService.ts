import { Inject, Service } from "typedi";
import { In, Repository } from "typeorm";

import { Service as ServiceEntity } from "../../entities/Service";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { MultipleServiceResponse } from "../../types/responses/ServiceResponse";
import { GetServicesDto } from "../../types/dtos/service";

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
import { S3BucketType } from "../../utils/enums";
import { S3Service } from "../../infrastructure/aws/S3Service";

@Service()
export class ServiceInfoService {
  private serviceInfoRepository: Repository<ServiceEntity>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => S3Service) private s3Service: S3Service
  ) {
    this.serviceInfoRepository =
      this.repositoryFactory.getRepository(ServiceEntity);
  }

  async checkServiceExists(name: string) {
    logger.info(
      `[ServiceInfoService.ts] 🔍 Searching for service with name: ${name}`
    );
    const isExisting = await this.serviceInfoRepository
      .createQueryBuilder("service")
      .where("LOWER(service.name) = :name", { name: name.toLowerCase() })
      .getExists();

    if (isExisting) {
      logger.warn(
        `[ServiceInfoService.ts] ⚠️ Service with name "${name}" already exists.`
      );
      throw new CustomError(SERVICE_ALREADY_EXISTS);
    }

    logger.info(
      `[ServiceInfoService.ts] ✅ Service name "${name}" is available.`
    );
  }

  async getAllServices(
    params: GetServicesDto
  ): Promise<MultipleServiceResponse> {
    const { page = 1, limit = 10, filters } = params;
    logger.info(
      `[ServiceInfoService.ts] 🔄 Fetching services for page ${page} with limit ${limit}`
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

    const serviceListWithUrls = await Promise.all(
      serviceList.map(async (service) => {
        try {
          const signedUrl = await this.s3Service.generateSignedUrl(
            service.imagePath,
            S3BucketType.IMAGE
          );
          (service as any).imageUrl = signedUrl; // not stored in DB, just added to response
        } catch (err) {
          logger.warn(
            `⚠️ Failed to generate signed URL for ${service.id}`,
            err
          );
        }

        return service;
      })
    );

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `[ServiceInfoService.ts] ✅ Retrieved ${serviceList.length} services from the database.`
    );
    return new MultipleServiceResponse(
      true,
      SERVICE_LIST,
      serviceListWithUrls,
      total,
      page,
      limit,
      totalPages
    );
  }

  async getServices(
    serviceIds: string[],
    categoryId: string
  ): Promise<MultipleServiceResponse> {
    logger.info(
      `[ServiceInfoService.ts] 📩 Received request to fetch services with IDs: ${serviceIds.join(
        ", "
      )}`
    );

    if (!serviceIds.length) {
      throw new CustomError(NO_SERVICE_ID_PROVIDED);
    }

    const services = await this.serviceInfoRepository.find({
      where: { id: In(serviceIds) },
      relations: ["category"],
    });

    if (!services || services.length !== serviceIds.length) {
      logger.warn(
        `[ServiceInfoService.ts] ⚠️ Some provided service IDs are invalid. Expected: ${serviceIds.length}, Found: ${services.length}`
      );
      validateFoundIds(services, serviceIds, "Invalid Service Ids");
    }
    await this.doServicesBelongToCategory(serviceIds, categoryId);

    logger.info(
      `[ServiceInfoService.ts] ✅ Successfully fetched ${services.length} service(s)`
    );
    return new MultipleServiceResponse(true, SERVICE_IDS_FOUND, services);
  }

  async doServicesBelongToCategory(
    serviceIds: string[],
    categoryId: string
  ): Promise<void> {
    logger.info(
      `[ServiceInfoService.ts] 📩 Checking if services belong to category ${categoryId}`
    );

    const count = await this.serviceInfoRepository.count({
      where: { id: In(serviceIds), category: { id: categoryId } },
      relations: ["category"],
    });

    // Check if all services exist and belong to the given category
    if (count !== serviceIds.length) {
      logger.warn(
        `[ServiceInfoService.ts] ⚠️ Some services do not belong to category ${categoryId}. Expected ${serviceIds.length}, found ${count}.`
      );

      throw new CustomError(SERVICE_DOES_NOT_BELONG_TO_THIS_CATEGORY);
    }

    logger.info(
      `[ServiceInfoService.ts] ✅ All services belong to category ${categoryId}`
    );
  }
}
