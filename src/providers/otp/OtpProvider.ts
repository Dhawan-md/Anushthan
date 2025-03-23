import { Service } from "typedi";
import { EntityManager, Repository } from "typeorm";
import speakeasy from "speakeasy";

import { Otp } from "../../entities/Otp";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { generateUserSecret } from "../../helpers/generateUserSecret";
import { logger } from "../../utils/logger";
import { generateOtp } from "../../helpers/generateOtp";
import { OtpResponse } from "../../types/responses/Otpresponse";
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

    const otp = transactionalEntityManager.create(Otp, {
      user,
      userEmail: user.userEmail,
      otpCode: otpData.otpCode,
      userSecret: userSecret.base32,
      createdAt: otpData.createdAt,
      expiresAt: otpData.expiresAt,
    });

    await transactionalEntityManager.save(otp);
    logger.info(
      `💾 OTP saved in the database for user with email ${user.userEmail}`
    );

    return new OtpResponse(true, OTP_SENT, otpData);
  }

  async resendOtp(
    userEmail: string,
    otpType: OtpType = OtpType.USER
  ): Promise<OtpResponse> {
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
      logger.warn(`❌ Otp has been expired for ${params.userEmail}`);
      throw new CustomError(EXPIRED_OTP);
    }

    const isMatching = speakeasy.totp.verify({
      secret: otpData.data.userSecret + otpData.data.createdAt.toString(),
      encoding: "base32",
      token: params.otpCode,
      step: 300,
      window: 0,
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
      { userEmail },
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
      otpCode?: string;
      userEmail?: string;
      userId?: string;
    },
    includeRelation: boolean = false
  ): Promise<Otp | null> {
    return await this.otpRepository.findOne({
      where: params.userId ? { user: { id: params.userId } } : params,
      ...(includeRelation ? { relations: ["user"] } : {}),
    });
  }

  private async checkOtpValidity(userEmail: string, otpType: OtpType) {
    logger.info(`🔎 Checking OTP validity for user ${userEmail}`);

    const otpData = await this.getOtpDetails({ userEmail });

    if (!otpData) {
      throw new CustomError(NO_OTP_FOUND);
    }
    const isOtpValid =
      otpData.expiresAt > new Date() &&
      otpData.status === OtpStatus.ACTIVE &&
      otpData.otpType === otpType;

    if (isOtpValid) {
      logger.info(`✅ Existing OTP is still valid: ${otpData.otpCode}`);
      return { success: true, data: otpData };
    }

    await this.disableOtp(userEmail);
    logger.warn(`❌ OTP expired or invalid for ${userEmail}, disabling it`);

    return { success: false, data: otpData };
  }
}
