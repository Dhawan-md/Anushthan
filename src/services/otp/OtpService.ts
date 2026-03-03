import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";
import speakeasy from "speakeasy";

import { Otp } from "../../entities/Otp";
import { User } from "../../entities/User";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { OtpResponse } from "../../types/responses/OtpResponse";
import { ResendOtpDto } from "../../types/dtos/Otp";
import { OtpToken } from "../../types/globalTypes";

import { generateUserSecret } from "../../helpers/generateUserSecret";
import { generateOtp } from "../../helpers/generateOtp"
import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";

import {
  EXPIRED_OTP,
  INVALID_OTP,
  NO_OTP_FOUND,
  OTP_GENERATION_FAILED,
  OTP_SENT,
  RESEND_OTP_SUCCESS,
  VALID_OTP,
} from "../../utils/messages";
import { ActiveStatus, OtpType } from "../../utils/enums";
import { TwilioService } from "../../infrastructure/sms/TwilioService";

@Service()
export class OtpService {
  private otpRepository: Repository<Otp>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => TwilioService) private twilioService: TwilioService
  ) {
    this.otpRepository = this.repositoryFactory.getRepository(Otp);
  }

  async saveOtp(user: User, transactionalEntityManager: EntityManager) {
    logger.info(`🔄 Generating OTP for user (${user.phoneNumber})`);

    const userSecret = generateUserSecret();
    const otpData = generateOtp(userSecret.base32);

    logger.info(
      `✅ OTP generated: ${otpData.otpCode}, expires at ${otpData.expiresAt}`
    );

    await transactionalEntityManager.save(Otp, {
      user,
      phoneNumber: user.phoneNumber,
      otpCode: otpData.otpCode,
      userSecret: userSecret.base32,
      createdAt: otpData.createdAt,
      expiresAt: otpData.expiresAt,
    });

    logger.info(
      `💾 OTP saved in the database for user with phone number: ${user.phoneNumber}`
    );

    return new OtpResponse(true, OTP_SENT, otpData);
  }

  async resendOtp(params: ResendOtpDto): Promise<OtpResponse> {
    const { phoneNumber, otpType = OtpType.USER } = params;
    logger.info(`🔄 Resending ${otpType} OTP for ${phoneNumber}.`);

    const newOtp = await this.generateAndSaveNewOtp(phoneNumber, otpType);

    await this.twilioService.sendOtp(phoneNumber, newOtp.otpCode);

    return new OtpResponse(true, RESEND_OTP_SUCCESS, newOtp);
  }

  async verifyOtp(params: {
    phoneNumber: string;
    otpCode: string;
    otpType: OtpType;
  }): Promise<OtpResponse> {
    logger.info(
      `🔍 Verifying OTP for user with phone number ${params.phoneNumber}`
    );

    const otpData = await this.checkOtpValidity(
      params.phoneNumber,
      params.otpType
    );

    if (!otpData.success) {
      logger.warn(`❌ ${otpData.message} for ${params.phoneNumber}`);
      throw new CustomError(otpData.message);
    }

    const isMatching = speakeasy.totp.verify({
      secret: otpData.data.userSecret + otpData.data.createdAt,
      encoding: "base32",
      token: params.otpCode,
      step: 300,
      window: 1,
      digits: 4,
    });

    if (!isMatching) {
      logger.warn(
        `❌ Invalid OTP for user with phone number ${params.phoneNumber}`
      );
      throw new CustomError(INVALID_OTP);
    }

    logger.info(
      `✅ OTP verified successfully for user with phone number ${params.phoneNumber}`
    );
    this.disableOtp(params.phoneNumber);

    return new OtpResponse(true, VALID_OTP);
  }

  async disableOtp(phoneNumber: string) {
    await this.otpRepository.update(
      { phoneNumber: phoneNumber },
      { status: ActiveStatus.INACTIVE }
    );
  }

  async generateAndSaveNewOtp(phoneNumber: string, otpType): Promise<OtpToken> {
    logger.info(`🔄 Fetching OTP details for phone number ${phoneNumber}`);

    const existingOtp = await this.checkOtpValidity(phoneNumber, otpType);

    if (existingOtp.success) {
      return existingOtp.data;
    }

    logger.info(`🔄 Generating a new OTP for ${existingOtp.data.phoneNumber}`);

    const newOtp = generateOtp(existingOtp.data.userSecret);

    if (!newOtp) {
      throw new CustomError(OTP_GENERATION_FAILED);
    }

    await this.otpRepository.update(
      { id: existingOtp.data.id },
      { ...newOtp, status: ActiveStatus.ACTIVE, otpType }
    );

    logger.info(
      `✅ New OTP generated: ${newOtp.otpCode}, expires at ${newOtp.expiresAt}`
    );

    return newOtp;
  }

  private async getOtpDetails(
    params: {
      phoneNumber: string;
    },
    includeRelation: boolean = false
  ): Promise<Otp | null> {
    return await this.otpRepository.findOne({
      where: { phoneNumber: params.phoneNumber },
      ...(includeRelation ? { relations: ["user"] } : {}),
    });
  }

  private async checkOtpValidity(phoneNumber: string, otpType: OtpType) {
    logger.info(
      `🔎 Checking OTP validity for user with phone number ${phoneNumber}`
    );

    const otpData = await this.getOtpDetails({ phoneNumber });

    if (!otpData) {
      throw new CustomError(NO_OTP_FOUND);
    }
    const isOtpActive =
      otpData.expiresAt > new Date() && otpData.status === ActiveStatus.ACTIVE;

    const isOtpValid = otpData.otpType === otpType;

    if (isOtpValid && isOtpActive) {
      logger.info(`✅ Existing OTP is still valid: ${otpData.otpCode}`);
      return { success: true, message: VALID_OTP, data: otpData };
    }

    if (!isOtpActive) {
      await this.disableOtp(phoneNumber);
      logger.warn(`❌ OTP expired for ${phoneNumber}, disabling it`);
      return { success: false, message: EXPIRED_OTP, data: otpData };
    }

    return { success: false, message: INVALID_OTP, data: otpData };
  }
}
