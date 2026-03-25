import { Inject, Service } from "typedi";
import { verify } from "jsonwebtoken";

import { env } from "../../config/env";
import { OtpService } from "../otp/OtpService";
import { UpdatePanditService } from "./UpdatePanditService";
import { PanditInfoService } from "./PanditInfoService";


import { EmailService } from "../../infrastructure/email/EmailService";

import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { VerifyResetResponse } from "../../types/responses/VerifyResetResponse";

import { logger } from "../../utils/logger";
import { EmailName, OtpType } from "../../utils/enums";
import {
  MISSING_ENV_VARIABLES,
  OLD_PASSWORD_ERROR,
  OTP_SENT,
  OTP_VERIFICATION_REQUIRED,
  RESET_PASSWORD_SUCCESS,
  INVALID_PASSWORD,
} from "../../utils/messages";
import { getEmailTypeByOtpType } from "../../utils/getEmailTypeByOtp";
import { validatePassword } from "../../utils/validatePassword";
import { CustomError } from "../../utils/customError";
import { hashPassword } from "../../utils/hashPassword";
import { isSamePassword } from "../../utils/isSamePassword";
import {
  ForgetPasswordDto,
  ResetPasswordDto,
  VerifyResetPasswordDto,
} from "../../types/dtos/Pandit";
import { generateVerificationToken } from "../../helpers/generateJwtToken";
import { ChangePasswordInput } from "../../types/inputTypes/pandit/ChangePasswordInput";

@Service()
export class PanditPasswordService {
  constructor(
    @Inject(() => OtpService) private otpService: OtpService,
    @Inject(() => PanditInfoService)
    private panditInfoService: PanditInfoService,
    @Inject(() => UpdatePanditService)
    private updatePanditService: UpdatePanditService,
    @Inject(() => EmailService)
    private emailService: EmailService
  ) { }

  async forgetPassword(
    params: ForgetPasswordDto
  ): Promise<SinglePanditResponse> {
    const { userEmail, phoneNumber } = params;
    logger.info(
      `🔄 Forget password request received for pandit with email: ${userEmail}`
    );

    const panditDetails = await this.panditInfoService.getPandit({
      data: { phoneNumber },
      withUser: true,
    });

    const otp = await this.otpService.generateAndSaveNewOtp(
      phoneNumber,
      OtpType.FORGET_PASSWORD
    );

    await this.emailService.sendEmail(
      panditDetails.user.userEmail,
      { name: EmailName.PANDIT, otpCode: otp.otpCode },
      getEmailTypeByOtpType(OtpType.FORGET_PASSWORD)
    );

    return new SinglePanditResponse(true, OTP_SENT);
  }

  async verifyResetPassword(
    params: VerifyResetPasswordDto
  ): Promise<VerifyResetResponse> {
    const { phoneNumber, otpCode } = params;
    logger.info(`📨 Verifying OTP for phoneNumber: ${phoneNumber}`);

    const isValidOTp = await this.otpService.verifyOtp({
      phoneNumber,
      otpCode,
      otpType: OtpType.FORGET_PASSWORD,
    });

    const panditData = await this.panditInfoService.getPandit({
      data: { phoneNumber },
    });

    const verificationToken = generateVerificationToken({ panditId: panditData.id });

    return new VerifyResetResponse(
      isValidOTp.success,
      isValidOTp.message,
      verificationToken
    );
  }

  async resetPassword(params: ResetPasswordDto): Promise<SinglePanditResponse> {
    const { newPassword, otpToken } = params;

    const jwtSecret = env.ACCESS_TOKEN_SECRET;
    if (!jwtSecret) {
      throw new CustomError(MISSING_ENV_VARIABLES);
    }

    let payload: { panditId: string };
    try {
      payload = verify(otpToken, jwtSecret) as { panditId: string };
    } catch (err) {
      logger.error("❌ Invalid or expired token during resetPassword");
      throw new CustomError(OTP_VERIFICATION_REQUIRED);
    }

    const { panditId } = payload;
    logger.info(`🔄 Password reset request for panditId: ${panditId}`);

    validatePassword(newPassword);

    const panditData = await this.panditInfoService.getPandit({
      data: { id: panditId },
    });

    const isMatching = await isSamePassword({
      inputPassword: newPassword,
      hashedPassword: panditData.password,
    });

    if (isMatching) {
      logger.warn(
        `⚠️ Pandit with ${panditId} tried to set the same password again`
      );
      throw new CustomError(OLD_PASSWORD_ERROR);
    }

    const hashedPassword = await hashPassword(newPassword);
    panditData.password = hashedPassword;

    await this.updatePanditService.updatePandit(panditData, panditId);

    logger.info(
      `✅ Password reset successful for pandit with pandit id: ${panditId}`
    );

    return new SinglePanditResponse(true, RESET_PASSWORD_SUCCESS);
  }

  async changePassword(panditId: string, params: ChangePasswordInput): Promise<SinglePanditResponse> {
    const { oldPassword, newPassword } = params;

    validatePassword(newPassword);

    const panditData = await this.panditInfoService.getPandit({ data: { id: panditId }});

    const isMatchingOld = await isSamePassword({
      inputPassword: oldPassword,
      hashedPassword: panditData.password
    });

    if (!isMatchingOld) {
      throw new CustomError(INVALID_PASSWORD);
    }

    const isMatchingNew = await isSamePassword({
      inputPassword: newPassword,
      hashedPassword: panditData.password
    });

    if (isMatchingNew) {
      throw new CustomError(OLD_PASSWORD_ERROR);
    }

    panditData.password = await hashPassword(newPassword);
    await this.updatePanditService.updatePandit(panditData, panditId);

    return new SinglePanditResponse(true, "Password changed successfully");
  }
}
