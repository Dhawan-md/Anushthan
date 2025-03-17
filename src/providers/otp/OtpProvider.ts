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

@Service()
export class OtpProvider {
  private otpRepository: Repository<Otp>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.otpRepository = this.repositoryFactory.getRepository(Otp);
  }

  async saveOtp(userId: string, userEmail: string) {
    logger.info(`🔄 Generating OTP for user ${userId} (${userEmail})`);

    const userSecret = generateUserSecret();
    const otpData = generateOtp(userSecret.base32);

    logger.info(
      `✅ OTP generated: ${otpData.otpCode}, expires at ${otpData.expiresAt}`
    );

    const otp = this.otpRepository.create({
      userEmail,
      otpCode: otpData.otpCode,
      userSecret: userSecret.base32,
      createdAt: otpData.createdAt,
      expiresAt: otpData.expiresAt,
    });

    await this.otpRepository.save(otp);
    logger.info(`💾 OTP saved in the database for user ${userId}`);

    return new OtpResponse(true, OTP_SENT, otpData);
  }

  async resendOtp(userEmail: string, otpType: OtpType): Promise<OtpResponse> {
    logger.info(`🔄 Resending ${otpType} OTP for ${userEmail}.`);

    const isExistingOtp = await this.getOtpDetails({ userEmail });

    if (!isExistingOtp) {
      throw new CustomError(NO_OTP_FOUND);
    }

    let otpToSend: OtpToken = {
      otpCode: isExistingOtp.otpCode,
      createdAt: isExistingOtp.createdAt,
      expiresAt: isExistingOtp.expiresAt,
    };

    if (
      isExistingOtp.expiresAt < new Date() ||
      isExistingOtp.status === OtpStatus.INACTIVE ||
      isExistingOtp.otpType !== otpType
    ) {
      logger.info(`🔄 Generating a new OTP for ${userEmail}`);
      const newOtp = generateOtp(isExistingOtp.userSecret);

      await this.otpRepository.update(
        { id: isExistingOtp.id },
        {
          otpCode: newOtp.otpCode,
          createdAt: newOtp.createdAt,
          expiresAt: newOtp.expiresAt,
          status: OtpStatus.ACTIVE,
          otpType: otpType,
        }
      );
      logger.info(
        `✅ New OTP generated: ${newOtp.otpCode}, expires at ${newOtp.expiresAt}`
      );

      otpToSend = newOtp;
    }

    const emailType = getEmailTypeByOtpType(otpType);

    await sendEmail(
      userEmail,
      {
        name: isExistingOtp.user.name,
        otpCode: otpToSend.otpCode,
      },
      emailType
    );

    return new OtpResponse(true, RESEND_OTP_SUCCESS, otpToSend);
  }

  async getOtpDetails(params: {
    otpCode?: string;
    userEmail?: string;
    userId?: string;
  }): Promise<Otp | null> {
    return await this.otpRepository.findOne({
      where: params,
    });
  }
}
