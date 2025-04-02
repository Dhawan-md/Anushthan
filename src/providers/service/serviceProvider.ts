import { Service } from "typedi";
import { Repository } from "typeorm";

import { Service as ServiceEntity} from "../../entities/Service";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { ServiceResponse } from "../../types/responses/ServiceResponse";
import { SERVICE_ADDED_SUCCESS } from "../../utils/messages";

@Service()
export class ServiceProvider {
  private serviceRepository: Repository<ServiceEntity>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.serviceRepository = this.repositoryFactory.getRepository(ServiceEntity);
  }

  async addService(params: {
    name: string;
    description?: string;
    price: number;
    duration: number;
  }): Promise<ServiceResponse> {
    const service = this.serviceRepository.create({
      name: params.name,
      description: params.description,
      price: params.price,
      duration: params.duration,
    });

    await this.serviceRepository.save(service);

    return new ServiceResponse(true, SERVICE_ADDED_SUCCESS);
  }
}
