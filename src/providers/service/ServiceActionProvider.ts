import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import sharp from "sharp";

import { CategoryInfoProvider } from "../category/CategoryInfoProvider";
import { ServiceInfoProvider } from "./ServiceInfoProvider";

import { Service as ServiceEntity } from "../../entities/Service";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleServiceResponse } from "../../types/responses/ServiceResponse";
import { AddServiceDto } from "../../types/dtos/Admin";

import { logger } from "../../utils/logger";
import { SERVICE_ADDED_SUCCESS } from "../../utils/messages";
import {
  generateCleanFileName,
  uploadBufferToS3,
} from "../../helpers/uploadS3Files";
import { S3BucketType } from "../../utils/enums";
import { getCloudfrontUrl } from "../../helpers/getCloudFrontUrl";
import { streamToBuffer } from "../../helpers/streamToBuffer";

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

    // 1️⃣ Generate final S3 file names (but do NOT upload original)
    const [{ cleanName }] = await generateCleanFileName(image);

    // base folder
    const baseKey = `services/${cleanName.replace(/\.[^.]+$/, "")}`;

    const thumbKey = `${baseKey}_thumb.jpg`;
    const smallKey = `${baseKey}_small.jpg`;
    const largeKey = `${baseKey}_large.jpg`;

    // 2️⃣ Read original upload stream EXACTLY ONE TIME
    const file = await image;
    const buffer = await streamToBuffer(file.createReadStream());

    // 3️⃣ Generate resized versions
    // Thumbnail — for precache, small spots
    const thumbBuffer = await sharp(buffer)
      .resize(400) // was 200
      .jpeg({ quality: 80 })
      .toBuffer();

    // Small — used in service cards
    const smallBuffer = await sharp(buffer)
      .resize(900) // was 400
      .jpeg({ quality: 88 })
      .toBuffer();

    // Large — for detailed views
    const largeBuffer = await sharp(buffer)
      .resize(1600) // new resize
      .jpeg({ quality: 92 })
      .toBuffer();

    // 4️⃣ Upload resized versions
    await uploadBufferToS3(
      thumbBuffer,
      thumbKey,
      "image/jpeg",
      S3BucketType.IMAGE
    );
    await uploadBufferToS3(
      smallBuffer,
      smallKey,
      "image/jpeg",
      S3BucketType.IMAGE
    );
    await uploadBufferToS3(
      largeBuffer,
      largeKey,
      "image/jpeg",
      S3BucketType.IMAGE
    );

    // 5️⃣ Generate CloudFront URLs
    const imageThumbUrl = getCloudfrontUrl(thumbKey);
    const imageSmallUrl = getCloudfrontUrl(smallKey);
    const imageUrl = getCloudfrontUrl(largeKey);

    logger.info(
      `[ServiceActionProvider.ts] 🖼️ Images uploaded (thumb, small, large) for: ${cleanName}`
    );

    logger.debug(`[ServiceActionProvider.ts] 📦 Creating service with data`, {
      name,
      description,
      duration,
      price,
      categoryId,
    });

    // 6️⃣ Save service
    const service = this.serviceActionRepository.create({
      name,
      description,
      duration,
      price,
      category: categoryDetails,
      imageThumbUrl,
      imageSmallUrl,
      imageUrl,
    });

    await this.serviceActionRepository.save(service);

    logger.info(
      `[ServiceActionProvider.ts] ✅ Service added successfully: ${service.name} (ID: ${service.id})`
    );

    return new SingleServiceResponse(true, SERVICE_ADDED_SUCCESS, service);
  }
}
