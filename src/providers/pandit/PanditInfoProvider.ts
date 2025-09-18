import { Service } from "typedi";
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

@Service()
export class PanditInfoProvider {
  private panditInfoRepository: Repository<Pandit>;

  constructor(private repositoryFactory: RepositoryFactory) {
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
    const { userId, phoneNumber } = params;

    const query = this.panditInfoRepository
      .createQueryBuilder("pandit")
      .innerJoin("pandit.user", "user");

    if (userId) {
      logger.info(`🔍 Checking if pandit exists with userId: ${userId}`);
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
      ...(withCategory ? { relations: ["category"] } : {}),
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
    logger.info(`🔍 Fetching pandit documents from S3.`);
    let parsedFilePathArray = JSON.parse(filePathArray);

    let signedUrls = await Promise.all(
      parsedFilePathArray.map((filePath: string) => {
        return generateSignedUrl(filePath, S3BucketType.DOCUMENT);
      })
    );

    logger.info(
      `[PanditInfoProvider.ts]✅ Retrieved pandit documents from S3.`
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

    await sendEmail(userEmail, { name: name }, emailTypeMap[status]);
  }

  async findPanditsInRadius(
    userLocation: { latitude: number; longitude: number },
    radiusKm = 10
  ) {
    // Fetch user's location first
    const { latitude, longitude } = userLocation;

    logger.info(`🔍 Searching pandits in ${10} km radius.`);

    const { raw, entities } = await this.panditInfoRepository
      .createQueryBuilder("pandit")
      .innerJoin("pandit.user", "user")
      .innerJoin("user.userLocation", "location")
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
      .orderBy("distance", "ASC")
      .getRawAndEntities();

    const resultWithDistance = entities.map((entity, index) => ({
      ...entity,
      distance: parseFloat(raw[index]?.distance),
    }));

    logger.info(`✅ Fetched the results of pandits in ${10} km radius.`);
    return resultWithDistance;
  }
}
