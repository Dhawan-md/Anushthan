import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { CategoryInfoProvider } from "../category/CategoryInfoProvider";
import { ServiceInfoProvider } from "./ServiceInfoProvider";

import { Service as ServiceEntity } from "../../entities/Service";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleServiceResponse } from "../../types/responses/ServiceResponse";
import { AddServiceDto } from "../../types/dtos/Admin";

import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { SERVICE_ADDED_SUCCESS } from "../../utils/messages";

@Service()
export class ServiceActionProvider {
  private serviceActionRepository: Repository<ServiceEntity>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => ServiceInfoProvider)
    private serviceInfoProvider: ServiceInfoProvider,
    @Inject(() => CategoryInfoProvider)
    private categoryInfoProvider: CategoryInfoProvider
  ) {
    this.serviceActionRepository =
      this.repositoryFactory.getRepository(ServiceEntity);
  }

  async addService(params: AddServiceDto): Promise<SingleServiceResponse> {
    const { name, categoryId, description, duration, price } = params;
    logger.info(
      `[ServiceActionProvider.ts] 📩 Received request to add new service: ${name}`
    );

    try {
      await this.serviceInfoProvider.checkServiceExists(name);

      const categoryDetails =
        await this.categoryInfoProvider.getCategoryDetails(categoryId);

      logger.debug(`[ServiceActionProvider.ts] 📦 Creating service with data`, {
        name,
        description,
        duration,
        price,
        categoryId,
      });

      const service = this.serviceActionRepository.create({
        name,
        description,
        duration,
        price,
        category: categoryDetails,
      });

      await this.serviceActionRepository.save(service);

      logger.info(
        `[ServiceActionProvider.ts] ✅ Service added successfully: ${service.name} (ID: ${service.id})`
      );

      return new SingleServiceResponse(true, SERVICE_ADDED_SUCCESS, service);
    } catch (error) {
      logger.error(
        `[ServiceActionProvider.ts] ❌ Failed to add service: ${name}`,
        error
      );
      throw new CustomError("Unable to add service. Please try again.");
    }
  }
}
