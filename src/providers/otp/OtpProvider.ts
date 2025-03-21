import { Service } from "typedi";
import { Repository } from "typeorm";
import speakeasy from "speakeasy";
import bcrypt from "bcryptjs";

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
  OTP_VERIFICATION_REQUIRED,
  RESEND_OTP_SUCCESS,
  SESSION_EXPIRED,
  VALID_OTP,
} from "../../utils/messages";
import { OtpStatus, OtpType } from "../../utils/enums";
import { CustomError } from "../../utils/custumError";
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

  async saveOtp(user: User) {
    logger.info(`🔄 Generating OTP for user (${user.userEmail})`);

    const userSecret = generateUserSecret();
    const otpData = generateOtp(userSecret.base32);

    logger.info(
      `✅ OTP generated: ${otpData.otpCode}, expires at ${otpData.expiresAt}`
    );

    const otp = this.otpRepository.create({
      user,
      userEmail: user.userEmail,
      otpCode: otpData.otpCode,
      userSecret: userSecret.base32,
      createdAt: otpData.createdAt,
      expiresAt: otpData.expiresAt,
    });

    await this.otpRepository.save(otp);
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

    const isMatching = speakeasy.totp.verify({
      secret: otpData.userSecret + otpData.createdAt.toString(),
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

  async verifyOtpToken(userEmail: string, token: string) {
    const otpData = await this.getOtpDetails({ userEmail });

    if (!otpData) {
      throw new CustomError(NO_OTP_FOUND);
    }

    if (new Date() > otpData.expiresAt) {
      throw new CustomError(SESSION_EXPIRED);
    }

    const isValidToken = await bcrypt.compare(otpData.otpCode, token);
    if (!isValidToken) {
      throw new CustomError(OTP_VERIFICATION_REQUIRED);
    }
  }

  private async checkOtpValidity(userEmail: string, otpType: OtpType) {
    logger.info(`🔎 Checking OTP validity for user ${userEmail}`);

    const otpData = await this.getOtpDetails({ userEmail });

    if (!otpData) {
      throw new CustomError(NO_OTP_FOUND);
    }

    if (otpData.status === OtpStatus.INACTIVE) {
      throw new CustomError(EXPIRED_OTP);
    }

    const isExpired = otpData.expiresAt < new Date();
    const isInvalid = otpData.otpType !== otpType;

    if (isExpired || isInvalid) {
      await this.disableOtp(userEmail);
      throw new CustomError(EXPIRED_OTP);
    }

    logger.info(`✅ OTP is valid for user ${userEmail}`);

    return otpData;
  }

  async disableOtp(userEmail: string) {
    await this.otpRepository.update(
      { userEmail },
      { status: OtpStatus.INACTIVE }
    );
  }

  async generateAndSaveNewOtp(userEmail: string, otpType): Promise<OtpToken> {
    logger.info(`🔄 Fetching OTP details for ${userEmail}`);

    const existingOtp = await this.getOtpDetails({ userEmail }, true);

    if (!existingOtp) {
      throw new CustomError(NO_OTP_FOUND);
    }

    const isOtpValid =
      existingOtp.expiresAt > new Date() &&
      existingOtp.status === OtpStatus.ACTIVE &&
      existingOtp.otpType === otpType;

    if (isOtpValid) {
      logger.info(`✅ Existing OTP is still valid: ${existingOtp.otpCode}`);
      return existingOtp;
    }

    logger.info(`🔄 Generating a new OTP for ${existingOtp.userEmail}`);

    const newOtp = generateOtp(existingOtp.userSecret);

    if (!newOtp) {
      throw new CustomError(OTP_GENERATION_FAILED);
    }

    await this.otpRepository.update(
      { id: existingOtp.id },
      { ...newOtp, status: OtpStatus.ACTIVE, otpType }
    );

    logger.info(
      `✅ New OTP generated: ${newOtp.otpCode}, expires at ${newOtp.expiresAt}`
    );

    return newOtp;
  }

  async getOtpDetails(
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
}
