import { Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { CancelledBooking } from "../../entities/CancelledBooking";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { logger } from "../../utils/logger";

import { CreateCancellationDto } from "../../types/dtos/Booking";

@Service()
export class CancelBookingProvider {
  private cancelBookingRepository: Repository<CancelledBooking>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.cancelBookingRepository =
      this.repositoryFactory.getRepository(CancelledBooking);
  }

  async createCancellation(
    params: CreateCancellationDto,
    manager?: EntityManager
  ): Promise<CancelledBooking> {
    const em = manager || this.cancelBookingRepository.manager;

    logger.info(`[CancelBookingProvider] Creating cancellation fee:`, params);

    const cancellationDetails = em.create(CancelledBooking, params);
    await em.save(CancelledBooking, cancellationDetails);

    return cancellationDetails;
  }
}
