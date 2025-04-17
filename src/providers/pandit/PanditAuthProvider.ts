import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import { FileUpload } from "graphql-upload-minimal";

import { UserInfoProvider } from "../user/UserInfoProvider";
import { ServiceProvider } from "../service/ServiceProvider";
import { Pandit } from "../../entities/Pandit";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { uploadFiles } from "../../helpers/uploadS3Files";
import {
  EmailName,
  EmailType,
  OtpType,
  S3BucketType,
  UserRole,
} from "../../utils/enums";
import { validatePassword } from "../../utils/validatePassword";
import { hashPassword } from "../../utils/hashPassword";
import { CustomError } from "../../utils/customError";
import {
  FILE_UPLOAD_FAIL,
  INVALID_PASSWORD,
  LOGIN_SUCCESSFUL,
  PANDIT_REGISTERED,
  SERVICE_NOT_FOUND,
} from "../../utils/messages";
import { sendEmail } from "../../service/email/sendEmail";
import { logger } from "../../utils/logger";
import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { PanditInfoProvider } from "./PanditInfoProvider";
import { validateEmail } from "../../utils/validateEmail";
import { isSamePassword } from "../../utils/isSamePassword";
import { OtpProvider } from "../otp/OtpProvider";
import { generateJwtToken } from "../../helpers/generateJwtToken";
import { verifyOtpParams } from "../../utils/types";

@Service()
export class PanditAuthProvider {
  private panditAuthRepository: Repository<Pandit>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoProvider)
    private userInfoProvider: UserInfoProvider,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider,
    @Inject(() => ServiceProvider)
    private serviceProvider: ServiceProvider,
    @Inject(() => OtpProvider)
    private otpProvider: OtpProvider
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

  async loginPandit(params: {
    userEmail: string;
    password: string;
  }): Promise<SinglePanditResponse> {
    const { userEmail, password } = params;
    logger.info(`🔄Logging in pandit: ${userEmail}.`);

    validateEmail(userEmail);
    validatePassword(password);

    const panditData = await this.panditInfoProvider.getPandit({
      userEmail: userEmail,
    });

    await isSamePassword({
      inputPassword: password,
      hashedPassword: panditData.password,
    });

    if (!isSamePassword) {
      throw new CustomError(INVALID_PASSWORD);
    }

    const otp = await this.otpProvider.generateAndSaveNewOtp(
      userEmail,
      OtpType.PANDIT
    );

    await sendEmail(
      userEmail,
      { name: EmailName.PANDIT, otpCode: otp.otpCode },
      EmailType.PANDIT_LOGGIN
    );

    logger.info(`✅ Pandit with ${userEmail} logged in requested.`);

    return new SinglePanditResponse(true, PANDIT_REGISTERED);
  }

  async verifyPandit(params: verifyOtpParams): Promise<SinglePanditResponse> {
    const { userEmail, otpCode } = params;
    logger.info(`🔄 Verification request received for: ${userEmail}`);

    const panditData = await this.panditInfoProvider.getPandit({
      userEmail,
    });

    logger.info(`🔍 Verifying OTP for ${userEmail}`);
    await this.otpProvider.verifyOtp({
      userEmail,
      otpCode,
      otpType: OtpType.USER,
    });

    const jwtToken = generateJwtToken({
      id: panditData.id,
      userRole: UserRole.PANDIT,
    });

    logger.info(`✅ Pandit with ${userEmail} logged in successfully.`);
    return new SinglePanditResponse(
      true,
      LOGIN_SUCCESSFUL,
      panditData,
      jwtToken
    );
  }
}
