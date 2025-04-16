import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import { FileUpload } from "graphql-upload-minimal";

import { UserInfoProvider } from "../user/UserInfoProvider";
import { ServiceProvider } from "../service/ServiceProvider";
import { Pandit } from "../../entities/Pandit";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { uploadFiles } from "../../helpers/uploadS3Files";
import { EmailType, S3BucketType } from "../../utils/enums";
import { validatePassword } from "../../utils/validatePassword";
import { hashPassword } from "../../utils/hashPassword";
import { CustomError } from "../../utils/customError";
import {
  FILE_UPLOAD_FAIL,
  PANDIT_REGISTERED,
  SERVICE_NOT_FOUND,
} from "../../utils/messages";
import { sendEmail } from "../../service/email/sendEmail";
import { logger } from "../../utils/logger";
import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { PanditInfoProvider } from "./PanditInfoProvider";

@Service()
export class PanditAuthProvider {
  private panditAuthRepository: Repository<Pandit>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoProvider)
    private userInfoProvider: UserInfoProvider,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider,
    @Inject(() => ServiceProvider) private serviceProvider: ServiceProvider
  ) {
    this.panditAuthRepository = this.repositoryFactory.getRepository(Pandit);
  }

  async registerPandit(params: {
    userId: string;
    password: string;
    documents: FileUpload[];
    serviceIds: string[];
    experience: number;
    address: string;
  }): Promise<SinglePanditResponse> {
    validatePassword(params.password);
    await this.panditInfoProvider.checkPanditExists(params.userId);

    const user = await this.userInfoProvider.getUser({ id: params.userId });

    const services = await this.serviceProvider.getServices(params.serviceIds);

    const hashedPassword = await hashPassword(params.password);

    let uploadedDocuments: { filePath: string }[] | { filePath: string } =
      await uploadFiles(params.documents, S3BucketType.DOCUMENT);

    if (!uploadedDocuments) {
      throw new CustomError(FILE_UPLOAD_FAIL);
    }

    if (!services.data || services.data.length === 0) {
      throw new CustomError(SERVICE_NOT_FOUND);
    }

    const newPandit = await this.panditAuthRepository.save({
      user,
      services: services.data,
      experience: params.experience,
      password: hashedPassword,
      address: params.address,
      documents: JSON.stringify(uploadedDocuments.map((file) => file.filePath)),
    });

    await sendEmail(
      user.userEmail,
      {
        name: user.name,
      },
      EmailType.PANDIT_PENDING
    );

    logger.info(`✅ User ${newPandit.id} registered successfully.`);
    return new SinglePanditResponse(true, PANDIT_REGISTERED, newPandit);
  }
}
