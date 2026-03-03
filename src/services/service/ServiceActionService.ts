import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { CategoryInfoService } from "../category/CategoryInfoService";
import { ServiceInfoService } from "./ServiceInfoService";

import { Service as ServiceEntity } from "../../entities/Service";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleServiceResponse } from "../../types/responses/ServiceResponse";
import { AddServiceDto } from "../../types/dtos/Admin";

import { logger } from "../../utils/logger";
import { SERVICE_ADDED_SUCCESS } from "../../utils/messages";
import { S3Service } from "../../infrastructure/aws/S3Service";
import { S3BucketType } from "../../utils/enums";

@Service()
export class ServiceActionService {
  private serviceActionRepository: Repository<ServiceEntity>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => ServiceInfoService)
    private serviceInfoService: ServiceInfoService,
    @Inject(() => CategoryInfoService)
    private categoryInfoService: CategoryInfoService,
    @Inject(() => S3Service)
    private s3Service: S3Service
  ) {
    this.serviceActionRepository =
      this.repositoryFactory.getRepository(ServiceEntity);
  }

  async addService(params: AddServiceDto): Promise<SingleServiceResponse> {
    const { name, categoryId, description, duration, price, image } = params;
    logger.info(
      `[ServiceActionService.ts] 📩 Received request to add new service: ${name}`
    );

    await this.serviceInfoService.checkServiceExists(name);

    const categoryDetails =
      await this.categoryInfoService.getCategoryDetails(categoryId);

    let uploadedImagePath: string;

    const uploaded = await this.s3Service.uploadFiles(image, S3BucketType.IMAGE);
    uploadedImagePath = uploaded[0].filePath;
    logger.info(
      `[ServiceActionService.ts] 🖼️ Image uploaded to S3: ${uploadedImagePath}`
    );

    logger.debug(`[ServiceActionService.ts] 📦 Creating service with data`, {
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
      `[ServiceActionService.ts] ✅ Service added successfully: ${service.name} (ID: ${service.id})`
    );

    return new SingleServiceResponse(true, SERVICE_ADDED_SUCCESS, service);
  }
}
