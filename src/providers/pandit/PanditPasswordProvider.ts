import { Inject, Service } from "typedi";
import { verify } from "jsonwebtoken";

import { OtpProvider } from "../otp/OtpProvider";
import { UpdatePanditProvider } from "./UpdatePanditProvider";
import { PanditInfoProvider } from "./PanditInfoProvider";


import { sendEmail } from "../../service/email/sendEmail";

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
import { generateVerifivationToken } from "../../helpers/generateJwtToken";

@Service()
export class PanditPasswordProvider {
  constructor(
    @Inject(() => OtpProvider) private otpProvider: OtpProvider,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider,
    @Inject(() => UpdatePanditProvider)
    private updatePanditProvider: UpdatePanditProvider
  ) {}

  async forgetPassword(
    params: ForgetPasswordDto
  ): Promise<SinglePanditResponse> {
    const { userEmail, phoneNumber } = params;
    logger.info(
      `🔄 Forget password request received for pandit with email: ${userEmail}`
    );

    const panditDetails = await this.panditInfoProvider.getPandit({
      data: { phoneNumber },
      withUser: true,
    });

    const otp = await this.otpProvider.generateAndSaveNewOtp(
      phoneNumber,
      OtpType.FORGET_PASSWORD
    );

    await sendEmail(
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

    const isValidOTp = await this.otpProvider.verifyOtp({
      phoneNumber,
      otpCode,
      otpType: OtpType.FORGET_PASSWORD,
    });

    const panditData = await this.panditInfoProvider.getPandit({
      data: { phoneNumber },
    });

    const verificationToken = generateVerifivationToken({ panditId: panditData.id });

    return new VerifyResetResponse(
      isValidOTp.success,
      isValidOTp.message,
      verificationToken
    );
  }

  async resetPassword(params: ResetPasswordDto): Promise<SinglePanditResponse> {
    const { newPassword, otpToken } = params;

    const jwtSecret = process.env["ACCESS_TOKEN_SECRET"];
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

    const panditData = await this.panditInfoProvider.getPandit({
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

    await this.updatePanditProvider.updatePandit(panditData, panditId);

    logger.info(
      `✅ Password reset successful for pandit with pandit id: ${panditId}`
    );

    return new SinglePanditResponse(true, RESET_PASSWORD_SUCCESS);
  }
}
