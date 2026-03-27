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
import { TwilioService } from "../../infrastructure/sms/TwilioService";
import { FirebaseOtpService } from "../../infrastructure/sms/FirebaseOtpService";

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

@Service()
export class OtpService {
  private otpRepository: Repository<Otp>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => TwilioService) private twilioService: TwilioService,
    @Inject(() => FirebaseOtpService) private firebaseOtpService: FirebaseOtpService
  ) {
    this.otpRepository = this.repositoryFactory.getRepository(Otp);
  }

  async saveOtp(user: User, transactionalEntityManager: EntityManager) {
    logger.info(`🔄 Generating OTP for user (${user.phoneNumber})`);

    const userSecret = generateUserSecret();
    const otpData = generateOtp(userSecret.base32);

    logger.info(
      `✅ Local OTP generated: ${otpData.otpCode}`
    );

    let sessionInfo: string | undefined;
    let finalOtpCode = otpData.otpCode;
    
    try {
      sessionInfo = await this.firebaseOtpService.sendOtp(user.phoneNumber);
      logger.info(`🔥 Firebase OTP sent. SessionInfo: ${sessionInfo}`);
    } catch (error: any) {
      logger.warn(`⚠️ Firebase SMS failed: ${error.message}. Falling back to Twilio...`);
      try {
        await this.twilioService.sendOtp(user.phoneNumber, otpData.otpCode);
      } catch (twilioError: any) {
        logger.error(`❌ All SMS providers failed for ${user.phoneNumber}. Using dummy OTP 1234.`);
        finalOtpCode = "1234";
      }
    }

    await transactionalEntityManager.save(Otp, {
      user,
      phoneNumber: user.phoneNumber,
      otpCode: finalOtpCode,
      userSecret: userSecret.base32,
      sessionInfo: sessionInfo,
      createdAt: otpData.createdAt,
      expiresAt: otpData.expiresAt,
    });

    return new OtpResponse(true, OTP_SENT, { ...otpData, otpCode: finalOtpCode });
  }

  async resendOtp(params: ResendOtpDto): Promise<OtpResponse> {
    const { phoneNumber, otpType = OtpType.USER } = params;

    const newOtp = await this.generateAndSaveNewOtp(phoneNumber, otpType);

    logger.info(`🔄 Resending ${otpType} OTP for ${phoneNumber}.`);

    let sessionInfo: string | undefined;
    let finalOtpCode = newOtp.otpCode;
    
    try {
        sessionInfo = await this.firebaseOtpService.sendOtp(phoneNumber);
        await this.otpRepository.update({ phoneNumber }, { sessionInfo });
    } catch (error: any) {
        logger.warn(`⚠️ Firebase resend failed: ${error.message}. Falling back to Twilio...`);
        try {
            await this.twilioService.sendOtp(phoneNumber, newOtp.otpCode);
        } catch (twilioError: any) {
            logger.error(`❌ All SMS providers failed for ${phoneNumber}. Using dummy OTP 1234.`);
            finalOtpCode = "1234";
            await this.otpRepository.update({ phoneNumber }, { otpCode: "1234" });
        }
    }

    return new OtpResponse(true, RESEND_OTP_SUCCESS, { ...newOtp, otpCode: finalOtpCode });
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

    // Try Firebase Verification if sessionInfo exists
    if (otpData.data.sessionInfo) {
        try {
            logger.info(`🔍 Verifying via Firebase Session...`);
            await this.firebaseOtpService.verifyOtp(otpData.data.sessionInfo, params.otpCode);
            logger.info(`✅ Firebase verification successful.`);
        } catch (error: any) {
            logger.warn(`⚠️ Firebase verification failed: ${error.message}. Retrying with local code...`);
            // Continue to local verification as fallback
            this.localVerify(otpData.data, params.otpCode, params.phoneNumber);
        }
    } else {
        this.localVerify(otpData.data, params.otpCode, params.phoneNumber);
    }

    logger.info(
      `✅ OTP verified successfully for user with phone number ${params.phoneNumber}`
    );
    this.disableOtp(params.phoneNumber);

    return new OtpResponse(true, VALID_OTP);
  }

  private localVerify(otpData: Otp, otpCode: string, phoneNumber: string) {
    // 1. Check if it matches the DB stored code (allows for dummy codes like 1234)
    if (otpData.otpCode === otpCode) {
        logger.info(`✅ OTP matched DB stored code (${otpCode}).`);
        return;
    }

    // 2. Fallback to speakeasy TOTP verification
    const isMatching = speakeasy.totp.verify({
        secret: otpData.userSecret + otpData.createdAt,
        encoding: "base32",
        token: otpCode,
        step: 300,
        window: 1,
        digits: 4,
    });

    if (!isMatching) {
        logger.warn(
            `❌ Invalid Local OTP for user with phone number ${phoneNumber}`
        );
        throw new CustomError(INVALID_OTP);
    }
  }

  async disableOtp(phoneNumber: string) {
    await this.otpRepository.update(
      { phoneNumber: phoneNumber },
      { status: ActiveStatus.INACTIVE, sessionInfo: undefined }
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
