import { Service } from "typedi";
import { Repository } from "typeorm";

import { Pandit } from "../../entities/Pandit";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { MultiplePanditResponse } from "../../types/responses/PanditResponse";
import { logger } from "../../utils/logger";
import {
  FETCH_DOCUMENT_SUCCESS,
  NO_PANDIT_FOUND,
  PANDIT_ALREADY_EXISTS,
  PANDIT_LIST,
} from "../../utils/messages";
import { CustomError } from "../../utils/customError";
import { getPanditParams, notifyPanditParams } from "../../utils/types";
import { MultipleDocumentResponse } from "../../types/responses/DocumentResponse";
import { generateSignedUrl } from "../../helpers/generateSignedUrl";
import { EmailType, PanditStatus, S3BucketType } from "../../utils/enums";
import { sendEmail } from "../../service/email/sendEmail";

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
    logger.info(`🔄 Fetching users for page ${page} with limit ${limit}`);

    const [panditList, total] = await this.panditInfoRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    logger.info(`✅ Retrieved ${panditList.length} pandits from the database.`);
    return new MultiplePanditResponse(true, PANDIT_LIST, panditList, total);
  }

  async checkPanditExists(userId: string) {
    logger.info(`🔍 Searching for pandit with userId: ${userId}`);
    const isExisting = await this.panditInfoRepository
      .createQueryBuilder("pandit")
      .innerJoin("pandit.user", "user")
      .where("pandit.user.id = :id", { userId })
      .getExists();

    if (isExisting) {
      throw new CustomError(PANDIT_ALREADY_EXISTS);
    }
  }

  async getPandit(
    params: getPanditParams,
    withUser: boolean = false
  ): Promise<Pandit> {
    logger.info(`🔍 Searching for pandit with params: ${params.id}`);

    const whereClause =
      "userEmail" in params
        ? { user: { userEmail: params.userEmail } }
        : { id: params.id };

    const panditData = await this.panditInfoRepository.findOne({
      where: whereClause,
      ...(withUser ? { relations: ["user"] } : {}),
    });

    if (!panditData) {
      logger.warn(
        `❌ No user found with email or id: ${params.userEmail || params.id}`
      );
      throw new CustomError(NO_PANDIT_FOUND);
    }

    return panditData;
  }

  async getDocument(filePathArray: string): Promise<MultipleDocumentResponse> {
    logger.info(`🔍 Fetching pandit documents from S3.`);
    let parsedFilePathArray = JSON.parse(filePathArray);

    let signedUrls = parsedFilePathArray.map(async (filePath: string) => {
      return await generateSignedUrl(filePath, S3BucketType.DOCUMENT);
    });

    logger.info(`✅ Retrieved vendor documents from S3.`);
    return new MultipleDocumentResponse(
      true,
      FETCH_DOCUMENT_SUCCESS,
      signedUrls
    );
  }

  async notifyVendor(params: notifyPanditParams) {
    const emailTypeMap: Record<PanditStatus, EmailType> = {
      [PanditStatus.APPROVED]: EmailType.PANDIT_APPROVED,
      [PanditStatus.REJECTED]: EmailType.PANDIT_REJECTED,
      [PanditStatus.SUSPENDED]: EmailType.PANDIT_SUSPENDED,
      [PanditStatus.PENDING]: EmailType.PANDIT_PENDING,
    };

    await sendEmail(
      params.userEmail,
      { name: params.name },
      emailTypeMap[params.status]
    );
  }
}
