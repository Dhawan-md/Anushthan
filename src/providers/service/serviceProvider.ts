import { Service } from "typedi";
import { In, Repository } from "typeorm";

import { Service as ServiceEntity } from "../../entities/Service";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import {
  MultipleServiceResponse,
  SingleServiceResponse,
} from "../../types/responses/ServiceResponse";
import {
  SERVICE_ADDED_SUCCESS,
  SERVICE_ALREADY_EXISTS,
  SERVICE_IDS_FOUND,
} from "../../utils/messages";
import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { validateFoundIds } from "../../utils/validateFoundIds";

@Service()
export class ServiceProvider {
  private serviceRepository: Repository<ServiceEntity>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.serviceRepository =
      this.repositoryFactory.getRepository(ServiceEntity);
  }

  private async checkServiceExists(name: string) {
    logger.info(`🔍 Searching for service with name: ${name}`);
    const isExisting = await this.serviceRepository
      .createQueryBuilder("service")
      .where("service.name = :name", { name })
      .getExists();

    if (isExisting) {
      logger.warn(`❌ Service found with name: ${name}`);
      throw new CustomError(SERVICE_ALREADY_EXISTS);
    }
  }

  async addService(params: {
    name: string;
    description?: string;
    price: number;
    duration: number;
  }): Promise<SingleServiceResponse> {
    await this.checkServiceExists(params.name);

    const service = this.serviceRepository.create({
      name: params.name,
      description: params.description,
      price: params.price,
      duration: params.duration,
    });

    await this.serviceRepository.save(service);

    return new SingleServiceResponse(true, SERVICE_ADDED_SUCCESS, service);
  }

  async getServices(serviceIds: string[]): Promise<MultipleServiceResponse> {
    const services = await this.serviceRepository.find({
      where: { id: In(serviceIds) },
    });

    if (!services || services.length !== serviceIds.length) {
      validateFoundIds(services, serviceIds, "Invalid Ids:");
    }

    return new MultipleServiceResponse(true, SERVICE_IDS_FOUND, services);
  }
}
