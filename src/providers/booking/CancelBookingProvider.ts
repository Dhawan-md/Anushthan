import { Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { CancelledBooking } from "../../entities/CancelledBooking";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { CreateCancellationFeeDto } from "../../types/dtos/booking";

@Service()
export class CancelBookingProvider {
  private cancelBookingRepository: Repository<CancelledBooking>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.cancelBookingRepository =
      this.repositoryFactory.getRepository(CancelledBooking);
  }

  async createCancellationFee(
    params: CreateCancellationFeeDto,
    manager?: EntityManager
  ): Promise<CancelledBooking> {
    const em = manager || this.cancelBookingRepository.manager;

    const fee = em.create(CancelledBooking, params);
    await em.save(CancelledBooking, fee);

    return fee;
  }
}
