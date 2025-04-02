import { Repository } from "typeorm";
import { Service } from "../../entities/Service";
import { RepositoryFactory } from "../../factories/RepositoryFactory";

export class serviceProvider {
  private serviceRepository: Repository<Service>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.serviceRepository = this.repositoryFactory.getRepository(Service);
  }

  async addService(params: {
    name: string;
    description: string | null;
    price: number;
    duration: number;
  }) {
    const service = this.serviceRepository.create({
      name: params.name,
      description: params.description,
      price: params.price,
      duration: params.duration,
    });

    await this.serviceRepository.save(service);
  }
}
