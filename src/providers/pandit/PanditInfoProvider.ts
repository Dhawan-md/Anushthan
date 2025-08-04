import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { Pandit } from "../../entities/Pandit";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { MultiplePanditResponse } from "../../types/responses/PanditResponse";

import { generateSignedUrl } from "../../helpers/generateSignedUrl";

import { sendEmail } from "../../service/email/sendEmail";

import { MultipleDocumentResponse } from "../../types/responses/DocumentResponse";

import { logger } from "../../utils/logger";
import {
  FETCH_DOCUMENT_SUCCESS,
  NO_PANDIT_FOUND,
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
import { UserLocationProvider } from "../user/UserLocationProvider";
import { UserLocation } from "../../entities/UserLocation";

@Service()
export class PanditInfoProvider {
  private panditInfoRepository: Repository<Pandit>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserLocationProvider)
    private userLocationProvider: UserLocationProvider
  ) {
    this.panditInfoRepository = this.repositoryFactory.getRepository(Pandit);
  }

  async getAllPandits(
    params: GetAllPanditsDto
  ): Promise<MultiplePanditResponse> {
    const { page = 1, limit = 10, status } = params;
    logger.info(
      `🔄 Fetching pandits for page ${page} with limit ${limit}, status: ${
        status || "ALL"
      }`
    );

    const [panditList, total] = await this.panditInfoRepository.findAndCount({
      where: status ? { status } : {},
      skip: (page - 1) * limit,
      take: limit,
      relations: ["services", "user"],
    });

    const totalPages = Math.ceil(total / limit);

    logger.info(`✅ Retrieved ${panditList.length} pandits from the database.`);
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
    const { userId, userEmail } = params;

    const query = this.panditInfoRepository
      .createQueryBuilder("pandit")
      .innerJoin("pandit.user", "user");

    if (userId) {
      logger.info(`🔍 Checking if pandit exists with userId: ${userId}`);
      query.where("user.id = :userId", { userId });
    }

    if (userEmail) {
      const normalizedEmail = userEmail.trim().toLowerCase();
      logger.info(
        `🔍 Checking if pandit exists with userEmail: ${normalizedEmail}`
      );
      query.where("LOWER(user.userEmail) = :userEmail", {
        userEmail: normalizedEmail,
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
    const { id, userEmail } = data;

    const normalizedEmail = userEmail?.trim().toLowerCase();
    logger.info(
      `🔍 Searching for pandit with params: ${id || normalizedEmail}`
    );

    const whereClause =
      "userEmail" in params ? { user: { userEmail: normalizedEmail } } : { id };

    const panditData = await this.panditInfoRepository.findOne({
      where: whereClause,
      ...(withUser ? { relations: ["user"] } : {}),
      ...(withCategory ? { relations: ["category"] } : {}),
    });

    if (!panditData) {
      logger.warn(
        `❌ No pandit found with email or id: ${normalizedEmail || id}`
      );
      throw new CustomError(NO_PANDIT_FOUND);
    }

    return panditData;
  }

  async getDocument(filePathArray: string): Promise<MultipleDocumentResponse> {
    logger.info(`🔍 Fetching pandit documents from S3.`);
    let parsedFilePathArray = JSON.parse(filePathArray);

    let signedUrls = await Promise.all(
      parsedFilePathArray.map((filePath: string) => {
        return generateSignedUrl(filePath, S3BucketType.DOCUMENT);
      })
    );

    logger.info(`✅ Retrieved pandit documents from S3.`);
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

    await sendEmail(userEmail, { name: name }, emailTypeMap[status]);
  }

  async findNearbyPandits(userId: string, radiusKm = 10) {
    // Fetch user's location first
    const userLocation = await this.userLocationProvider.getLocationDetails(
      userId
    );

    if (!userLocation) throw new CustomError("User location not found");

    const { latitude, longitude } = userLocation;

    const pandits = await this.panditInfoRepository
      .createQueryBuilder("pandit")
      .innerJoin("pandit.user", "user")
      .innerJoin(UserLocation, "location", "location.userId = user.id")
      .where("pandit.isAvailable = :isAvailable", { isAvailable: true })
      .andWhere("pandit.status = :status", { status: "APPROVED" })
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
      )`,
        "distance"
      )
      .having("distance <= :radius", { radius: radiusKm })
      .setParameters({ lat: latitude, lng: longitude })
      .orderBy("distance", "ASC")
      .getRawAndEntities();

    return pandits.entities;
  }
}
