import { Service } from "typedi";
import { In, Repository } from "typeorm";

import { Service as ServiceEntity } from "../../entities/Service";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import {
  MultipleServiceResponse,
  SingleServiceResponse,
} from "../../types/responses/ServiceResponse";

import {
  NO_SERVICE_ID_PROVIDED,
  SERVICE_ADDED_SUCCESS,
  SERVICE_ALREADY_EXISTS,
  SERVICE_IDS_FOUND,
  SERVICE_LIST,
} from "../../utils/messages";
import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { validateFoundIds } from "../../utils/validateFoundIds";
import { AddServiceDto, PaginationDto } from "../../types/dtos/Admin";

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
      .where("LOWER(service.name) = :name", { name: name.toLowerCase() })
      .getExists();

    if (isExisting) {
      logger.warn(`⚠️ Service with name "${name}" already exists.`);
      throw new CustomError(SERVICE_ALREADY_EXISTS);
    }
  }

  async getAllServices(
    params: PaginationDto
  ): Promise<MultipleServiceResponse> {
    const { page = 1, limit = 10 } = params;
    logger.info(`🔄 Fetching services for page ${page} with limit ${limit}`);

    const [serviceList, total] = await this.serviceRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `✅ Retrieved ${serviceList.length} services from the database.`
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

  async addService(params: AddServiceDto): Promise<SingleServiceResponse> {
    const { name } = params;
    logger.info(`📩 Received request to add new service: ${name}`);

    await this.checkServiceExists(name);

    const service = this.serviceRepository.create(params);

    await this.serviceRepository.save(service);

    logger.info(`✅ New service added: ${service.name} (ID: ${service.id})`);
    return new SingleServiceResponse(true, SERVICE_ADDED_SUCCESS, service);
  }

  async getServices(serviceIds: string[]): Promise<MultipleServiceResponse> {
    logger.info(
      `📩 Received request to fetch services with IDs: ${serviceIds.join(", ")}`
    );

    if (!serviceIds.length) {
      throw new CustomError(NO_SERVICE_ID_PROVIDED);
    }

    const services = await this.serviceRepository.find({
      where: { id: In(serviceIds) },
    });

    if (!services || services.length !== serviceIds.length) {
      validateFoundIds(services, serviceIds, "Invalid Service Ids");
    }

    logger.info(`✅ Successfully fetched ${services.length} service(s)`);
    return new MultipleServiceResponse(true, SERVICE_IDS_FOUND, services);
  }
}
