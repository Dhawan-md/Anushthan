import { Service } from "typedi";
import { Repository } from "typeorm";

import { Otp } from "../../entities/Otp";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { generateUserSecret } from "../../helpers/generateUserSecret";
import { logger } from "../../utils/logger";
import { generateOtp } from "../../helpers/generateOtp";
import { OtpResponse } from "../../types/responses/Otpresponse";
import {
  NO_OTP_FOUND,
  OTP_SENT,
  RESEND_OTP_SUCCESS,
} from "../../utils/messages";
import { OtpStatus, OtpType } from "../../utils/enums";
import { CustomError } from "../../utils/custumError";
import { OtpToken } from "../../types/globalTypes";
import { sendEmail } from "../../service/email/sendEmail";
import { getEmailTypeByOtpType } from "../../helpers/getEmailTypeByOtp";
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
      userEmail:user.userEmail,
      otpCode: otpData.otpCode,
      userSecret: userSecret.base32,
      createdAt: otpData.createdAt,
      expiresAt: otpData.expiresAt,
    });

    await this.otpRepository.save(otp);
    logger.info(`💾 OTP saved in the database for user with email ${user.userEmail}`);

    return new OtpResponse(true, OTP_SENT, otpData);
  }

  async resendOtp(userEmail: string, otpType: OtpType): Promise<OtpResponse> {
    logger.info(`🔄 Resending ${otpType} OTP for ${userEmail}.`);

    const existingOtp = await this.getOtpDetails({ userEmail });

    if (!existingOtp) {
      throw new CustomError(NO_OTP_FOUND);
    }

    const isOtpValid =
      existingOtp.expiresAt > new Date() &&
      existingOtp.status === OtpStatus.ACTIVE &&
      existingOtp.otpType === otpType;

    const otpToSend = isOtpValid
      ? existingOtp
      : await this.generateAndSaveNewOtp(existingOtp, otpType);

    await sendEmail(
      userEmail,
      {
        name: existingOtp.user.name,
        otpCode: otpToSend.otpCode,
      },
      getEmailTypeByOtpType(otpType)
    );

    return new OtpResponse(true, RESEND_OTP_SUCCESS, otpToSend);
  }

  private async generateAndSaveNewOtp(
    existingOtp: Otp,
    otpType
  ): Promise<OtpToken> {
    logger.info(`🔄 Generating a new OTP for ${existingOtp.userEmail}`);

    const newOtp = generateOtp(existingOtp.userSecret);
    await this.otpRepository.update(
      { id: existingOtp.id },
      { ...newOtp, status: OtpStatus.ACTIVE, otpType }
    );

    logger.info(
      `✅ New OTP generated: ${newOtp.otpCode}, expires at ${newOtp.expiresAt}`
    );
    return newOtp;
  }

  private async getOtpDetails(params: {
    otpCode?: string;
    userEmail?: string;
    userId?: string;
  }): Promise<Otp | null> {
    return await this.otpRepository.findOne({
      where: params,
    });
  }
}
