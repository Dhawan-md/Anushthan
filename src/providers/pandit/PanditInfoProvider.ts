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

@Service()
export class PanditInfoProvider {
  private panditInfoRepository: Repository<Pandit>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.panditInfoRepository = this.repositoryFactory.getRepository(Pandit);
  }

  async getAllPandits(
    page: number = 1,
    limit: number = 10
  ): Promise<MultiplePanditResponse> {
    logger.info(`🔄 Fetching pandits for page ${page} with limit ${limit}`);

    const [panditList, total] = await this.panditInfoRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
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

  async getPandit(
    params: GetPanditParams,
    withUser: boolean = false
  ): Promise<Pandit> {
    const { userEmail, id } = params;

    const normalizedEmail = userEmail?.trim().toLowerCase();
    logger.info(
      `🔍 Searching for pandit with params: ${id || normalizedEmail}`
    );

    const whereClause =
      "userEmail" in params ? { user: { userEmail: normalizedEmail } } : { id };

    const panditData = await this.panditInfoRepository.findOne({
      where: whereClause,
      ...(withUser ? { relations: ["user"] } : {}),
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
        generateSignedUrl(filePath, S3BucketType.DOCUMENT);
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
}
