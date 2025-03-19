import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { User } from "../../entities/User";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { UserInfoProvider } from "./UserInfoProvider";
import { OtpProvider } from "../otp/OtpProvider";
import { logger } from "../../utils/logger";
import {
  NO_USER_FOUND,
  USER_ALREADY_VERIFIED,
  USER_UPDATED,
  USER_VERIFIED_SUCCESS,
} from "../../utils/messages";
import { SingleUserResponse } from "../../types/responses/UserResponse";
import { CustomError } from "../../utils/custumError";
import { EmailType, OtpType } from "../../utils/enums";
import { sendEmail } from "../../service/email/sendEmail";

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
    logger.info(`🔄 Updating user with ID: ${userId}`);
    const userData = await this.userInfoProvider.getUser({ id: userId });

    if (!userData) {
      throw new Error(NO_USER_FOUND);
    }

    Object.assign(userData, updatedUserData);
    await this.updateUserRepository.save(userData);

    const updatedUser = await this.updateUserRepository.save(userData);

    logger.info(`✅ Successfully updated user with ID: ${userId}`);
    return new SingleUserResponse(true, USER_UPDATED, updatedUser);
  }

  async verifyUser(
    userEmail: string,
    otpCode: string
  ): Promise<SingleUserResponse> {
    logger.info(`🔄 Verification request received for: ${userEmail}`);

    const userData = await this.userInfoProvider.getUser({
      userEmail,
    });
    if (!userData) {
      logger.warn(`❌ Error fetching user data for ${userEmail}`);
      throw new CustomError(NO_USER_FOUND);
    }

    if (userData.isVerified) {
      logger.info(`✅ User ${userEmail} is already verified`);
      await this.otpProvider.disableOtp(userData.id);
      return new SingleUserResponse(true, USER_ALREADY_VERIFIED);
    }

    logger.info(`🔍 Verifying OTP for ${userEmail}`);
    await this.otpProvider.verifyOtp({
      userId: userData.id,
      otpCode,
      OtpType: OtpType.USER,
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

    logger.info(`✅ User ${userEmail} successfully verified`);
    return new SingleUserResponse(true, USER_VERIFIED_SUCCESS);
  }
}
