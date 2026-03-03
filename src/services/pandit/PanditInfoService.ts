import { Inject, Service } from "typedi";
import { Repository } from "typeorm";


import { BookingInfoService } from "../booking/BookingInfoService";

import { Pandit } from "../../entities/Pandit";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { MultiplePanditResponse } from "../../types/responses/PanditResponse";

import { S3Service } from "../../infrastructure/aws/S3Service";

import { EmailService } from "../../infrastructure/email/EmailService";

import { MultipleDocumentResponse } from "../../types/responses/DocumentResponse";

import { logger } from "../../utils/logger";
import { getDistanceInKm } from "../../utils/getDistanceInKm";

import {
  FETCH_DOCUMENT_SUCCESS,
  NO_PANDIT_FOUND,
  NO_PANDITS_NEARBY,
  PANDIT_LIST,
} from "../../utils/messages";
import { CustomError } from "../../utils/customError";
import {
  CheckPanditExists,
  GetPanditParams,
  NotifyPanditParams,
} from "../../utils/interfaces";
import { EmailType, PanditStatus, S3BucketType } from "../../utils/enums";
import { GetAllPanditsDto } from "../../types/dtos/Admin";

@Service()
export class PanditInfoService {
  private panditInfoRepository: Repository<Pandit>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => BookingInfoService)
    private bookingInfoService: BookingInfoService,
    @Inject(() => EmailService)
    private emailService: EmailService,
    @Inject(() => S3Service)
    private s3Service: S3Service
  ) {
    this.panditInfoRepository = this.repositoryFactory.getRepository(Pandit);
  }

  async getAllPandits(
    params: GetAllPanditsDto
  ): Promise<MultiplePanditResponse> {
    const { page = 1, limit = 10, status } = params;
    logger.info(
      `[PanditInfoService.ts] 🔄 Fetching pandits for page ${page} with limit ${limit}, status: ${status || "ALL"
      }`
    );

    const [panditList, total] = await this.panditInfoRepository.findAndCount({
      where: status ? { status } : {},
      skip: (page - 1) * limit,
      take: limit,
      relations: ["services", "user"],
    });

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `[PanditInfoService.ts] ✅ Retrieved ${panditList.length} pandits from the database.`
    );
    logger.info(
      `[PanditInfoService.ts] ✅ Retrieved ${panditList.length} pandits from the database.`
    );
    return new MultiplePanditResponse(
      true,
      PANDIT_LIST,
      panditList,
      total,
      page,
      limit,
      totalPages
    );
  }

  async checkPanditExists(params: CheckPanditExists) {
    const { userId, phoneNumber } = params;

    const query = this.panditInfoRepository
      .createQueryBuilder("pandit")
      .innerJoin("pandit.user", "user");

    if (userId) {
      logger.info(
        `[PanditInfoService.ts] 🔍 Checking if pandit exists with userId: ${userId}`
      );

      query.where("user.id = :userId", { userId });
    }

    if (phoneNumber) {
      logger.info(
        `🔍 Checking if pandit exists with phoneNumber: ${phoneNumber}`
      );
      query.where("LOWER(user.phoneNumber) = :phoneNumber", {
        phoneNumber: phoneNumber,
      });
    }

    const isExisting = await query.getExists();

    return isExisting;
  }

  async getPandit(params: {
    data: GetPanditParams;
    withUser?: boolean;
    withCategory?: boolean;
  }): Promise<Pandit> {
    const { data, withCategory = false, withUser = false } = params;
    const { id, phoneNumber } = data;

    logger.info(`🔍 Searching for pandit with params: ${id || phoneNumber}`);

    const whereClause = phoneNumber ? { user: { phoneNumber } } : { id };

    const panditData = await this.panditInfoRepository.findOne({
      where: whereClause,
      ...(withUser ? { relations: ["user"] } : {}),
      ...(withCategory ? { relations: ["categories"] } : {}),
    });

    if (!panditData) {
      logger.warn(
        `❌ No pandit found with phone number or id: ${phoneNumber || id}`
      );
      throw new CustomError(NO_PANDIT_FOUND);
    }

    return panditData;
  }

  async getDocument(filePathArray: string): Promise<MultipleDocumentResponse> {
    logger.info(
      `[PanditInfoService.ts] 🔍 Fetching pandit documents from S3.`
    );
    let parsedFilePathArray = JSON.parse(filePathArray);

    let signedUrls = await Promise.all(
      parsedFilePathArray.map((filePath: string) => {
        return this.s3Service.generateSignedUrl(filePath, S3BucketType.DOCUMENT);
      })
    );

    logger.info(
      `[PanditInfoService.ts]✅ Retrieved pandit documents from S3.`
    );
    return new MultipleDocumentResponse(
      true,
      FETCH_DOCUMENT_SUCCESS,
      signedUrls
    );
  }

  async notifyVendor(params: NotifyPanditParams) {
    const { name, userEmail, status } = params;

    const emailTypeMap: Record<PanditStatus, EmailType> = {
      [PanditStatus.APPROVED]: EmailType.PANDIT_APPROVED,
      [PanditStatus.REJECTED]: EmailType.PANDIT_REJECTED,
      [PanditStatus.SUSPENDED]: EmailType.PANDIT_SUSPENDED,
      [PanditStatus.PENDING]: EmailType.PANDIT_PENDING,
    };

    await this.emailService.sendEmail(userEmail, { name: name }, emailTypeMap[status]);
  }

  async findPanditsInRadius(params: {
    userLocation: { latitude: number; longitude: number };
    filters?: { timeSlotId: string; bookingDate: Date };
    radiusKm;
    categoryId?: string;
  }) {
    // Fetch user's location first
    const { userLocation, filters, radiusKm } = params;
    const { latitude, longitude } = userLocation;

    logger.info(
      `[PanditInfoService.ts] 🔍 Searching pandits in ${radiusKm} km radius.`
    );

    const query = this.panditInfoRepository
      .createQueryBuilder("pandit")
      .innerJoinAndSelect("pandit.user", "user")
      .innerJoinAndSelect("user.userLocation", "location")
      .where("pandit.isAvailable = :isAvailable", { isAvailable: true })
      .andWhere("pandit.status = :status", { status: "approved" })
      .addSelect(
        `
    (
      6371 * acos(
        cos(radians(:lat)) *
        cos(radians(location.latitude)) *
        cos(radians(location.longitude) - radians(:lng)) +
        sin(radians(:lat)) *
        sin(radians(location.latitude))
      )
    )
  `,
        "distance"
      )
      .andWhere(
        `
    (
      6371 * acos(
        cos(radians(:lat)) *
        cos(radians(location.latitude)) *
        cos(radians(location.longitude) - radians(:lng)) +
        sin(radians(:lat)) *
        sin(radians(location.latitude))
      )
    ) <= :radius
  `,
        { radius: radiusKm }
      )
      .setParameters({ lat: latitude, lng: longitude })
      .orderBy("distance", "ASC");

    if (params.categoryId) {
      logger.info(
        `[PanditInfoService.ts] 📂 Applying category filter: ${params.categoryId}`
      );
      query
        .innerJoin("pandit.categories", "category")
        .andWhere("category.id = :categoryId", {
          categoryId: params.categoryId,
        });
    }

    const [entities, raw] = await Promise.all([
      query.getMany(),
      query.getRawMany(),
    ]);

    logger.info(
      `[PanditInfoService.ts] 📦 Retrieved ${entities.length} nearby pandits before filtering busy ones.`
    );

    const distanceMap = raw.reduce(
      (acc, row) => {
        acc[row.pandit_id] = parseFloat(row.distance); // check raw alias for id
        return acc;
      },
      {} as Record<string, number>
    );

    const nearbyPanditIds = entities.map((p) => p.id);
    let availablePandits = entities;

    if (filters?.timeSlotId || filters?.bookingDate) {
      logger.info(
        `[PanditInfoService.ts] ⏰ Applying time filter: timeSlotId=${filters.timeSlotId}, bookingDate=${filters.bookingDate}`
      );

      const busyPandits = await this.bookingInfoService.getAllBusyPandits(
        nearbyPanditIds,
        filters
      );

      if (!busyPandits.data) {
        logger.error(
          "[PanditInfoService.ts] ❌ Failed to fetch busy pandits."
        );
        throw new CustomError(NO_PANDITS_NEARBY);
      }

      const busyPanditIds = busyPandits.data.map((b) => b.panditId);

      logger.info(
        `[PanditInfoService.ts] 🚫 Found ${busyPanditIds.length} busy pandits, filtering them out.`
      );
      availablePandits = entities.filter((p) => !busyPanditIds.includes(p.id));
    }

    const resultWithDistance = availablePandits.map((entity) => ({
      ...entity,
      distance: distanceMap[entity.id] ?? null,
    }));

    logger.info(
      `[PanditInfoService.ts] ✅ Final result: ${resultWithDistance.length} pandits available within ${radiusKm} km.`
    );
    return resultWithDistance;
  }

  isPanditWithinRadius(
    userLat: number,
    userLng: number,
    panditLat: number,
    panditLng: number,
    radiusKm: number
  ): boolean {
    const distance = getDistanceInKm(
      { lat1: userLat, lon1: userLng },
      { lat2: panditLat, lon2: panditLng }
    );
    return distance <= radiusKm;
  }
}
