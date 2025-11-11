import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { CategoryInfoProvider } from "../category/CategoryInfoProvider";
import { ServiceInfoProvider } from "./ServiceInfoProvider";

import { Service as ServiceEntity } from "../../entities/Service";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleServiceResponse } from "../../types/responses/ServiceResponse";
import { AddServiceDto } from "../../types/dtos/Admin";

import { logger } from "../../utils/logger";
import { SERVICE_ADDED_SUCCESS } from "../../utils/messages";
import { uploadFiles } from "../../helpers/uploadS3Files";
import { S3BucketType } from "../../utils/enums";

@Service()
export class ServiceActionProvider {
  private serviceActionRepository: Repository<ServiceEntity>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => ServiceInfoProvider)
    private serviceInfoProvider: ServiceInfoProvider,
    @Inject(() => CategoryInfoProvider)
    private categoryInfoProvider: CategoryInfoProvider
  ) {
    this.serviceActionRepository =
      this.repositoryFactory.getRepository(ServiceEntity);
  }

  async addService(params: AddServiceDto): Promise<SingleServiceResponse> {
    const { name, categoryId, description, duration, price, image } = params;
    logger.info(
      `[ServiceActionProvider.ts] 📩 Received request to add new service: ${name}`
    );

    await this.serviceInfoProvider.checkServiceExists(name);

    const categoryDetails =
      await this.categoryInfoProvider.getCategoryDetails(categoryId);

    let uploadedImagePath: string;

    const uploaded = await uploadFiles(image, S3BucketType.IMAGE);
    uploadedImagePath = uploaded[0].filePath;
    logger.info(
      `[ServiceActionProvider.ts] 🖼️ Image uploaded to S3: ${uploadedImagePath}`
    );

    logger.debug(`[ServiceActionProvider.ts] 📦 Creating service with data`, {
      name,
      description,
      duration,
      price,
      categoryId,
    });

    const service = this.serviceActionRepository.create({
      name,
      description,
      duration,
      price,
      category: categoryDetails,
      imagePath: uploadedImagePath,
    });

    await this.serviceActionRepository.save(service);

    logger.info(
      `[ServiceActionProvider.ts] ✅ Service added successfully: ${service.name} (ID: ${service.id})`
    );

    return new SingleServiceResponse(true, SERVICE_ADDED_SUCCESS, service);
  }
}
