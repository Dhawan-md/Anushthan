import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { PanditInfoProvider } from "./PanditInfoProvider";

import { Pandit } from "../../entities/Pandit";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SinglePanditResponse } from "../../types/responses/PanditResponse";

import { logger } from "../../utils/logger";
import { NO_DATA_TO_UPDATE, PANDIT_UPDATED } from "../../utils/messages";
import { CustomError } from "../../utils/customError";
import { getBucketName } from "../../utils/getBucketName";
import { S3BucketType } from "../../utils/enums";
import { deleteS3File } from "../../helpers/deleteS3file";

@Service()
export class UpdatePanditProvider {
  private updatePanditRepository: Repository<Pandit>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider
  ) {
    this.updatePanditRepository = this.repositoryFactory.getRepository(Pandit);
  }

  async updatePandit(
    updatedPanditData: Partial<Pandit>,
    panditId: string,
    manager?: EntityManager
  ): Promise<SinglePanditResponse> {
    logger.info(`🔄 Updating pandit with ID: ${panditId}`);

    if (Object.keys(updatedPanditData).length === 0) {
      logger.warn(`⚠️ No fields provided to update for pandit ${panditId}`);
      throw new CustomError(NO_DATA_TO_UPDATE);
    }

    const em = manager || this.updatePanditRepository.manager;
    const panditData = await this.panditInfoProvider.getPandit({
      data: { id: panditId },
    });

    Object.assign(panditData, updatedPanditData);

    const updatedPandit = await em.save(Pandit, panditData);

    logger.info(
      `📝 Fields updated for pandit ${panditId}: ${Object.keys(
        updatedPanditData
      ).join(", ")}`
    );
    logger.info(`✅ Successfully updated pandit with ID: ${panditId}`);
    return new SinglePanditResponse(true, PANDIT_UPDATED, updatedPandit);
  }

  async deleteDocument(filePathArray: string): Promise<void> {
    logger.info(`🗑️ Deleting pandit documents from S3.`);
    let parsedFilePathArray = JSON.parse(filePathArray);
    const bucketName = getBucketName(S3BucketType.DOCUMENT);

    await Promise.all(
      parsedFilePathArray.map((filePath: string) => {
        return deleteS3File(bucketName, filePath);
      })
    );

    logger.info(`✅ Deleted pandit documents from S3.`);
  }
}
