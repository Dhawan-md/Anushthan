import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { Service as ServiceEntity } from "../../entities/Service";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleServiceResponse } from "../../types/responses/ServiceResponse";

import { SERVICE_ADDED_SUCCESS } from "../../utils/messages";
import { logger } from "../../utils/logger";
import { AddServiceDto } from "../../types/dtos/Admin";
import { ServiceInfoProvider } from "./ServiceInfoProvider";
import { CategoryInfoProvider } from "../category/CategoryInfoProvider";

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
    logger.info(`📩 Received request to add new service: ${name}`);

    await this.serviceInfoProvider.checkServiceExists(name);

    const categoryDetails = await this.categoryInfoProvider.getCategoryDetails(
      categoryId
    );

    const service = this.serviceActionRepository.create({
      name,
      description,
      duration,
      price,
      category: categoryDetails,
    });

    await this.serviceActionRepository.save(service);

    logger.info(`✅ New service added: ${service.name} (ID: ${service.id})`);
    return new SingleServiceResponse(true, SERVICE_ADDED_SUCCESS, service);
  }
}
