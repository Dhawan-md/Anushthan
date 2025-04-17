import { Inject, Service } from "typedi";
import { verify } from "jsonwebtoken";

import { logger } from "../../utils/logger";
import { OtpProvider } from "../otp/OtpProvider";
import { EmailName, OtpType } from "../../utils/enums";
import {
  MISSING_ENV_VARIABLES,
  OLD_PASSWORD_ERROR,
  OTP_SENT,
  OTP_VERIFICATION_REQUIRED,
  RESET_PASSWORD_SUCCESS,
} from "../../utils/messages";
import { sendEmail } from "../../service/email/sendEmail";
import { getEmailTypeByOtpType } from "../../utils/getEmailTypeByOtp";
import { validatePassword } from "../../utils/validatePassword";
import { CustomError } from "../../utils/customError";
import { VerifyResetResponse } from "../../types/responses/VerifyResetResponse";
import { generateJwtToken } from "../../helpers/generateJwtToken";
import { hashPassword } from "../../utils/hashPassword";
import { UpdatePanditProvider } from "./UpdatePanditProvider";
import { PanditInfoProvider } from "./PanditInfoProvider";
import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { isSamePassword } from "../../utils/isSamePassword";

@Service()
export class ForgetPasswordProvider {
  constructor(
    @Inject(() => OtpProvider) private otpProvider: OtpProvider,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider,
    @Inject(() => UpdatePanditProvider)
    private updatePanditProvider: UpdatePanditProvider
  ) {}

  async forgetPassword(userEmail: string): Promise<SinglePanditResponse> {
    logger.info(
      `🔄 Forget password request received for pandit with email: ${userEmail}`
    );

    const otp = await this.otpProvider.generateAndSaveNewOtp(
      userEmail,
      OtpType.FORGET_PASSWORD
    );

    await sendEmail(
      userEmail,
      { name: EmailName.PANDIT, otpCode: otp.otpCode },
      getEmailTypeByOtpType(OtpType.FORGET_PASSWORD)
    );

    return new SinglePanditResponse(true, OTP_SENT);
  }

  async verifyResetPassword(
    userEmail: string,
    otpCode: string
  ): Promise<VerifyResetResponse> {
    const isValidOTp = await this.otpProvider.verifyOtp({
      userEmail,
      otpCode,
      otpType: OtpType.FORGET_PASSWORD,
    });

    const panditData = await this.panditInfoProvider.getPandit({ userEmail });

    const verificationToken = generateJwtToken(
      { panditId: panditData.id },
      "15m"
    );

    return new VerifyResetResponse(
      isValidOTp.success,
      isValidOTp.message,
      verificationToken
    );
  }

  async resetPassword(params: {
    newPassword: string;
    otpToken: string;
  }): Promise<SinglePanditResponse> {
    const { newPassword, otpToken } = params;

    if (!process.env["JWT_SECRET"]) {
      throw new CustomError(MISSING_ENV_VARIABLES);
    }

    const payload = verify(otpToken, process.env["JWT_SECRET"]) as {
      panditId: string;
    };

    if (!payload.panditId) {
      throw new CustomError(OTP_VERIFICATION_REQUIRED);
    }

    const { panditId } = payload;
    logger.info(
      `🔄 Password reset request received for pandit with id: ${panditId}`
    );

    validatePassword(newPassword);

    const panditData = await this.panditInfoProvider.getPandit({
      id: panditId,
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
