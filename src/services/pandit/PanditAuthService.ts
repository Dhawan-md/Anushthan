import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { UserInfoService } from "../user/UserInfoService";
import { PanditInfoService } from "./PanditInfoService";
import { OtpService } from "../otp/OtpService";
import { CategoryInfoService } from "../category/CategoryInfoService";

import { Pandit } from "../../entities/Pandit";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { S3Service } from "../../infrastructure/aws/S3Service";

import { EmailService } from "../../infrastructure/email/EmailService";

import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import {
  LoginPanditDto,
  RegisterPanditDto,
  VerifyPanditDto,
} from "../../types/dtos/Pandit";

import { validatePassword } from "../../utils/validatePassword";
import { hashPassword } from "../../utils/hashPassword";
import { CustomError } from "../../utils/customError";
import { isSamePassword } from "../../utils/isSamePassword";

import { EmailType, OtpType, S3BucketType, UserRole } from "../../utils/enums";
import {
  CATEGORY_NOT_FOUND,
  FILE_UPLOAD_FAIL,
  INVALID_PASSWORD,
  LOGIN_SUCCESSFUL,
  PANDIT_ALREADY_EXISTS,
  PANDIT_LOGIN_REQUESTED,
  PANDIT_REGISTERED,
} from "../../utils/messages";
import { logger } from "../../utils/logger";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../helpers/generateJwtToken";
import admin from "../../config/firebase";

@Service()
export class PanditAuthService {
  private panditAuthRepository: Repository<Pandit>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoService)
    private userInfoService: UserInfoService,
    @Inject(() => PanditInfoService)
    private panditInfoService: PanditInfoService,
    @Inject(() => CategoryInfoService)
    private categoryInfoService: CategoryInfoService,
    @Inject(() => OtpService)
    private otpService: OtpService,
    @Inject(() => EmailService)
    private emailService: EmailService,
    @Inject(() => S3Service)
    private s3Service: S3Service
  ) {
    this.panditAuthRepository = this.repositoryFactory.getRepository(Pandit);
  }

  async registerPandit(
    params: RegisterPanditDto
  ): Promise<SinglePanditResponse> {
    logger.info(
      `🔄Processing register Pandit request for user with userId : ${params.userId}`
    );
    const { userId, password, documents, categoryIds, experience } = params;

    validatePassword(password);
    const isExisting = await this.panditInfoService.checkPanditExists({
      userId,
    });

    if (isExisting) {
      logger.warn(`⚠️ Pandit with userId "${userId}" already exists.`);
      throw new CustomError(PANDIT_ALREADY_EXISTS);
    }

    const user = await this.userInfoService.getUser({ id: userId });

    const categories =
      await this.categoryInfoService.getCategories(categoryIds);

    const hashedPassword = await hashPassword(password);

    let uploadedDocuments: { filePath: string }[] | { filePath: string } =
      await this.s3Service.uploadFiles(documents, S3BucketType.DOCUMENT);

    if (!uploadedDocuments) {
      throw new CustomError(FILE_UPLOAD_FAIL);
    }

    if (!categories.data || categories.data.length === 0) {
      throw new CustomError(CATEGORY_NOT_FOUND);
    }

    const newPandit = await this.panditAuthRepository.save({
      user,
      categories: categories.data,
      experience: experience,
      password: hashedPassword,
      documents: JSON.stringify(uploadedDocuments.map((file) => file.filePath)),
    });

    await this.emailService.sendEmail(
      user.userEmail,
      {
        name: user.name,
      },
      EmailType.PANDIT_PENDING
    );

    logger.info(`✅ User ${newPandit.id} registered successfully.`);
    return new SinglePanditResponse(true, PANDIT_REGISTERED, newPandit);
  }

  async loginPandit(params: LoginPanditDto): Promise<SinglePanditResponse> {
    const { phoneNumber, password } = params;
    logger.info(`🔄Logging in pandit with number: ${phoneNumber}.`);

    validatePassword(password);

    const panditData = await this.panditInfoService.getPandit({
      data: { phoneNumber },
      withUser: true,
    });

    const isMatching = await isSamePassword({
      inputPassword: password,
      hashedPassword: panditData.password,
    });

    if (!isMatching) {
      throw new CustomError(INVALID_PASSWORD);
    }

    await this.panditAuthRepository.manager.transaction(async (transactionalEntityManager) => {
      await this.otpService.saveOtp(panditData.user, transactionalEntityManager);
    });

    logger.info(
      `✅ Pandit with phone number ${phoneNumber} log in allowed. OTP sent.`
    );

    return new SinglePanditResponse(true, PANDIT_LOGIN_REQUESTED);
  }

  async verifyPandit(params: VerifyPanditDto): Promise<SinglePanditResponse> {
    const { phoneNumber, otpCode, idToken, deviceToken } = params;
    logger.info(
      `🔄 Verification request received for pandit with phone number: ${phoneNumber}`
    );

    if (idToken) {
      logger.info(`🔍 Verifying Firebase Token for pandit ${phoneNumber}`);
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebasePhoneNumber = decodedToken.phone_number;

        if (firebasePhoneNumber !== phoneNumber) {
          logger.warn(`⚠️ Token phone number mismatch: ${firebasePhoneNumber} vs ${phoneNumber}`);
        }
      } catch (error) {
        logger.error(`❌ Firebase token verification failed: ${error}`);
        throw new CustomError("Invalid Firebase token.");
      }
    } else if (otpCode) {
      logger.info(`🔍 Verifying Local OTP for pandit ${phoneNumber}`);
      await this.otpService.verifyOtp({
        phoneNumber,
        otpCode,
        otpType: OtpType.PANDIT,
      });
    } else {
      throw new CustomError("OTP code or Firebase token is required.");
    }

    const panditData = await this.panditInfoService.getPandit({
      data: { phoneNumber },
      withUser: true,
    });

    if (deviceToken) {
      await this.userInfoService.updateUserDeviceToken(
        panditData.user.id,
        deviceToken
      );
    }

    const accessToken = generateAccessToken({
      id: panditData.id,
      userRole: UserRole.PANDIT,
    });
    const refreshToken = generateRefreshToken({ id: panditData.id });

    logger.info(
      `✅ Pandit with phone number ${phoneNumber} logged in successfully.`
    );
    return new SinglePanditResponse(
      true,
      LOGIN_SUCCESSFUL,
      panditData,
      accessToken,
      refreshToken
    );
  }
}
