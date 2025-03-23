import { Inject, Service } from "typedi";
import bcrypt from "bcryptjs";
import { verify } from "jsonwebtoken";

import { SingleUserResponse } from "../../types/responses/UserResponse";
import { logger } from "../../utils/logger";
import { OtpProvider } from "../otp/OtpProvider";
import { OtpType } from "../../utils/enums";
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
import { UserInfoProvider } from "./UserInfoProvider";
import { CustomError } from "../../utils/customError";
import { UpdateUserProvider } from "./UpdateUserProvider";
import { VerifyResetResponse } from "../../types/responses/VerifyResetResponse";
import { generateJwtToken } from "../../helpers/generateJwtToken";
import { hashPassword } from "../../utils/hashPassword";

@Service()
export class ForgetPasswordProvider {
  constructor(
    @Inject(() => OtpProvider) private otpProvider: OtpProvider,
    @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider,
    @Inject(() => UpdateUserProvider)
    private updateUserProvider: UpdateUserProvider
  ) {}

  async forgetPassword(userEmail: string): Promise<SingleUserResponse> {
    logger.info(`🔄 Forget password request received for: ${userEmail}`);

    const otp = await this.otpProvider.generateAndSaveNewOtp(
      userEmail,
      OtpType.FORGET_PASSWORD
    );

    await sendEmail(
      userEmail,
      { otpCode: otp.otpCode },
      getEmailTypeByOtpType(OtpType.FORGET_PASSWORD)
    );

    return new SingleUserResponse(true, OTP_SENT);
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

    const userData = await this.userInfoProvider.getUser({ userEmail });

    const verificationToken = generateJwtToken(userData.id, "5m");

    return new VerifyResetResponse(
      isValidOTp.success,
      isValidOTp.message,
      verificationToken
    );
  }

  async resetPassword(params: {
    newPassword: string;
    otpToken: string;
  }): Promise<SingleUserResponse> {
    const { newPassword, otpToken } = params;

    if (!process.env["JWT_SECRET"]) {
      throw new CustomError(MISSING_ENV_VARIABLES);
    }

    const payload = verify(otpToken, process.env["JWT_SECRET"]) as {
      userId: string;
    };

    if (!payload.userId) {
      throw new CustomError(OTP_VERIFICATION_REQUIRED);
    }

    const { userId } = payload;
    logger.info(`🔄 Password reset request received for: ${userId}`);

    validatePassword(newPassword);

    const userData = await this.userInfoProvider.getUser({ id: userId });
    const isSamePassword = await bcrypt.compare(newPassword, userData.password);

    if (isSamePassword) {
      logger.warn(`⚠️ User ${userId} tried to set the same password again`);
      throw new CustomError(OLD_PASSWORD_ERROR);
    }

    const hashedPassword = await hashPassword(newPassword);
    userData.password = hashedPassword;

    await this.updateUserProvider.updateUser(userData, userData.id);
    logger.info(`✅ Password reset successful for ${userId}`);

    return new SingleUserResponse(true, RESET_PASSWORD_SUCCESS);
  }
}
