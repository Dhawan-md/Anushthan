import { Service } from "typedi";
import { In, Repository } from "typeorm";

import { Service as ServiceEntity } from "../../entities/Service";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import {
  MultipleServiceResponse,
  SingleServiceResponse,
} from "../../types/responses/ServiceResponse";
import { SERVICE_ADDED_SUCCESS, SERVICE_IDS_FOUND } from "../../utils/messages";
import { CustomError } from "../../utils/customError";

@Service()
export class ServiceProvider {
  private serviceRepository: Repository<ServiceEntity>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.serviceRepository =
      this.repositoryFactory.getRepository(ServiceEntity);
  }

  async addService(params: {
    name: string;
    description?: string;
    price: number;
    duration: number;
  }): Promise<SingleServiceResponse> {
    const service = this.serviceRepository.create({
      name: params.name,
      description: params.description,
      price: params.price,
      duration: params.duration,
    });

    await this.serviceRepository.save(service);

    return new SingleServiceResponse(true, SERVICE_ADDED_SUCCESS);
  }

  async getServices(serviceIds: string[]): Promise<MultipleServiceResponse> {
    const services = await this.serviceRepository.find({
      where: { id: In(serviceIds) },
    });

    if (!services || services.length !== serviceIds.length) {
      const foundIds = new Set(services.map((s) => s.id));
      const missing = serviceIds.filter((id) => !foundIds.has(id));

      throw new CustomError(`Invalid IDs: ${missing.join(", ")}`);
    }

    return new MultipleServiceResponse(true, SERVICE_IDS_FOUND, services);
  }
}
