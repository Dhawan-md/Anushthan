import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { User } from "../../entities/User";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { UserInfoProvider } from "./UserInfoProvider";
import { OtpProvider } from "../otp/OtpProvider";
import { logger } from "../../utils/logger";
import {
  USER_ALREADY_VERIFIED,
  USER_UPDATED,
  USER_VERIFIED_SUCCESS,
} from "../../utils/messages";
import { SingleUserResponse } from "../../types/responses/UserResponse";
import { EmailType, OtpType } from "../../utils/enums";
import { sendEmail } from "../../service/email/sendEmail";
import { generateJwtToken } from "../../helpers/generateJwtToken";

@Service()
export class UpdateUserProvider {
  private updateUserRepository: Repository<User>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider,
    @Inject(() => OtpProvider) private otpProvider: OtpProvider
  ) {
    this.updateUserRepository = this.repositoryFactory.getRepository(User);
  }

  async updateUser(updatedUserData: Partial<User>, userId: string) {
    return await this.updateUserRepository.manager.transaction(
      async (transactionalEnitityManager) => {
        logger.info(`🔄 Updating user with ID: ${userId}`);
        const userData = await this.userInfoProvider.getUser({ id: userId });

        Object.assign(userData, updatedUserData);

        const updatedUser = await transactionalEnitityManager.save(userData);

        logger.info(`✅ Successfully updated user with ID: ${userId}`);
        return new SingleUserResponse(true, USER_UPDATED, updatedUser);
      }
    );
  }

  async verifyUser(
    userEmail: string,
    otpCode: string
  ): Promise<SingleUserResponse> {
    logger.info(`🔄 Verification request received for: ${userEmail}`);

    const userData = await this.userInfoProvider.getUser({
      userEmail,
    });

    if (userData.isVerified) {
      logger.info(`✅ User ${userEmail} is already verified`);
      await this.otpProvider.disableOtp(userData.id);
      return new SingleUserResponse(true, USER_ALREADY_VERIFIED);
    }

    logger.info(`🔍 Verifying OTP for ${userEmail}`);
    await this.otpProvider.verifyOtp({
      userEmail,
      otpCode,
      otpType: OtpType.USER,
    });

    logger.info(`📧 Sending verification email to ${userEmail}`);
    await sendEmail(
      userData.userEmail,
      { name: userData.name },
      EmailType.ACCOUNT_VERIFIED
    );

    // Update user to set isVerified to true
    userData.isVerified = true;
    await this.updateUser(userData, userData.id);

    const jwtToken = generateJwtToken({
      userId: userData.id,
      isVerified: userData.isVerified,
      userRole: userData.userRole,
    });

    logger.info(`✅ User ${userEmail} successfully verified`);
    return new SingleUserResponse(true, USER_VERIFIED_SUCCESS, null, jwtToken);
  }
}
