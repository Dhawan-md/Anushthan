import { Service } from "typedi";
import { EntityManager, Repository } from "typeorm";
import speakeasy from "speakeasy";

import { Otp } from "../../entities/Otp";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { generateUserSecret } from "../../helpers/generateUserSecret";
import { logger } from "../../utils/logger";
import { generateOtp } from "../../helpers/generateOtp";
import { OtpResponse } from "../../types/responses/OtpResponse";
import {
  EXPIRED_OTP,
  INVALID_OTP,
  NO_OTP_FOUND,
  OTP_GENERATION_FAILED,
  OTP_SENT,
  RESEND_OTP_SUCCESS,
  VALID_OTP,
} from "../../utils/messages";
import { OtpStatus, OtpType } from "../../utils/enums";
import { CustomError } from "../../utils/customError";
import { OtpToken } from "../../types/globalTypes";
import { sendEmail } from "../../service/email/sendEmail";
import { getEmailTypeByOtpType } from "../../utils/getEmailTypeByOtp";
import { User } from "../../entities/User";
import { ResendOtpDto } from "../../types/dtos/otp";

@Service()
export class OtpProvider {
  private otpRepository: Repository<Otp>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.otpRepository = this.repositoryFactory.getRepository(Otp);
  }

  async saveOtp(user: User, transactionalEntityManager: EntityManager) {
    logger.info(`🔄 Generating OTP for user (${user.userEmail})`);

    const userSecret = generateUserSecret();
    const otpData = generateOtp(userSecret.base32);

    logger.info(
      `✅ OTP generated: ${otpData.otpCode}, expires at ${otpData.expiresAt}`
    );

    await transactionalEntityManager.save(Otp, {
      user,
      userEmail: user.userEmail.toLowerCase(),
      otpCode: otpData.otpCode,
      userSecret: userSecret.base32,
      createdAt: otpData.createdAt,
      expiresAt: otpData.expiresAt,
    });

    logger.info(
      `💾 OTP saved in the database for user with email ${user.userEmail}`
    );

    return new OtpResponse(true, OTP_SENT, otpData);
  }

  async resendOtp(params: ResendOtpDto): Promise<OtpResponse> {
    const { userEmail, otpType = OtpType.USER } = params;
    logger.info(`🔄 Resending ${otpType} OTP for ${userEmail}.`);

    const newOtp = await this.generateAndSaveNewOtp(userEmail, otpType);

    await sendEmail(
      userEmail,
      {
        otpCode: newOtp.otpCode,
      },
      getEmailTypeByOtpType(otpType)
    );

    return new OtpResponse(true, RESEND_OTP_SUCCESS, newOtp);
  }

  async verifyOtp(params: {
    userEmail: string;
    otpCode: string;
    otpType: OtpType;
  }): Promise<OtpResponse> {
    logger.info(`🔍 Verifying OTP for user ${params.userEmail}`);

    const otpData = await this.checkOtpValidity(
      params.userEmail,
      params.otpType
    );

    if (!otpData.success) {
      logger.warn(`❌ ${otpData.message} for ${params.userEmail}`);
      throw new CustomError(otpData.message);
    }

    const isMatching = speakeasy.totp.verify({
      secret: otpData.data.userSecret + otpData.data.createdAt,
      encoding: "base32",
      token: params.otpCode,
      step: 300,
      window: 1,
    });

    if (!isMatching) {
      logger.warn(`❌ Invalid OTP for user ${params.userEmail}`);
      throw new CustomError(INVALID_OTP);
    }

    logger.info(`✅ OTP verified successfully for user ${params.userEmail}`);
    this.disableOtp(params.userEmail);

    return new OtpResponse(true, VALID_OTP);
  }

  async disableOtp(userEmail: string) {
    await this.otpRepository.update(
      { userEmail: userEmail.toLowerCase() },
      { status: OtpStatus.INACTIVE }
    );
  }

  async generateAndSaveNewOtp(userEmail: string, otpType): Promise<OtpToken> {
    logger.info(`🔄 Fetching OTP details for ${userEmail}`);

    const existingOtp = await this.checkOtpValidity(userEmail, otpType);

    if (existingOtp.success) {
      return existingOtp.data;
    }

    logger.info(`🔄 Generating a new OTP for ${existingOtp.data.userEmail}`);

    const newOtp = generateOtp(existingOtp.data.userSecret);

    if (!newOtp) {
      throw new CustomError(OTP_GENERATION_FAILED);
    }

    await this.otpRepository.update(
      { id: existingOtp.data.id },
      { ...newOtp, status: OtpStatus.ACTIVE, otpType }
    );

    logger.info(
      `✅ New OTP generated: ${newOtp.otpCode}, expires at ${newOtp.expiresAt}`
    );

    return newOtp;
  }

  private async getOtpDetails(
    params: {
      userEmail: string;
    },
    includeRelation: boolean = false
  ): Promise<Otp | null> {
    return await this.otpRepository.findOne({
      where: { userEmail: params.userEmail.toLowerCase() },
      ...(includeRelation ? { relations: ["user"] } : {}),
    });
  }

  private async checkOtpValidity(userEmail: string, otpType: OtpType) {
    logger.info(`🔎 Checking OTP validity for user ${userEmail}`);

    const otpData = await this.getOtpDetails({ userEmail });

    if (!otpData) {
      throw new CustomError(NO_OTP_FOUND);
    }
    const isOtpActive =
      otpData.expiresAt > new Date() && otpData.status === OtpStatus.ACTIVE;

    const isOtpValid = otpData.otpType === otpType;

    if (isOtpValid && isOtpActive) {
      logger.info(`✅ Existing OTP is still valid: ${otpData.otpCode}`);
      return { success: true, message: VALID_OTP, data: otpData };
    }

    if (!isOtpActive) {
      await this.disableOtp(userEmail);
      logger.warn(`❌ OTP expired for ${userEmail}, disabling it`);
      return { success: false, message: EXPIRED_OTP, data: otpData };
    }

    return { success: false, message: INVALID_OTP, data: otpData };
  }
}
