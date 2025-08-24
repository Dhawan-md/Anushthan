import { Service } from "typedi";
import { Repository } from "typeorm";

import { TimeSlot } from "../../../entities/TimeSlot";

import { RepositoryFactory } from "../../../factories/RepositoryFactory";

import {
  MultipleTimeSlotResponse,
  SingleTimeSlotResponse,
} from "../../../types/responses/TimeSlotResonse";

import { logger } from "../../../utils/logger";
import {
  TIME_SLOT_CREATED_SUCCESS,
  TIME_SLOT_FOUND,
  TIME_SLOT_LIST,
  TIME_SLOT_NOT_FOUND,
} from "../../../utils/messages";
import { CreateTimeSlotDto } from "../../../types/dtos/Admin";
import { CustomError } from "../../../utils/customError";

@Service()
export class TimeSlotProvider {
  private timeSlotRepository: Repository<TimeSlot>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.timeSlotRepository = this.repositoryFactory.getRepository(TimeSlot);
  }

  async createTimeSlot(
    params: CreateTimeSlotDto
  ): Promise<SingleTimeSlotResponse> {
    const { label, startTime, endTime } = params;
    const timeSlot = this.timeSlotRepository.create({
      label,
      startTime,
      endTime,
    });

    const savedTimeSlot = await this.timeSlotRepository.save(timeSlot);

    return new SingleTimeSlotResponse(
      true,
      TIME_SLOT_CREATED_SUCCESS,
      savedTimeSlot
    );
  }

  async getTimeSlot(id: string): Promise<SingleTimeSlotResponse> {
    logger.info(`[TimeSlotProvider.ts] 📦 Fetching timeslot with id: ${id} `);
    const timeSlot = await this.timeSlotRepository.findOne({ where: { id } });

    logger.info(`[TimeSlotProvider.ts] ✅ Retrieved ${timeSlot?.label} `);

    if (!timeSlot) {
      logger.warn(
        `[TimeSlotProvider.ts] ⚠️ Time slot details not found for ID: ${id}`
      );
      throw new CustomError(TIME_SLOT_NOT_FOUND);
    }
    logger.info(`[TimeSlotProvider.ts] ✅ Retrieved ${timeSlot.label}`);

    return new SingleTimeSlotResponse(true, TIME_SLOT_FOUND, timeSlot);
  }

  async getAllTimeSlots(): Promise<MultipleTimeSlotResponse> {
    logger.info(`[TimeSlotProvider.ts] 📦 Fetching timeslots `);

    const [timeSlots, total] = await this.timeSlotRepository.findAndCount();

    logger.info(
      `[TimeSlotProvider.ts] ✅ Retrieved ${timeSlots.length} timeslots out of ${total} total.`
    );

    return new MultipleTimeSlotResponse(true, TIME_SLOT_LIST, timeSlots, total);
  }
}
