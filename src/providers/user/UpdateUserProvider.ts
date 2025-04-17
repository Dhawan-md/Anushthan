import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { User } from "../../entities/User";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { UserInfoProvider } from "./UserInfoProvider";
import { OtpProvider } from "../otp/OtpProvider";
import { logger } from "../../utils/logger";
import { LOGIN_SUCCESSFUL, USER_UPDATED } from "../../utils/messages";
import { SingleUserResponse } from "../../types/responses/UserResponse";
import { OtpType, UserRole } from "../../utils/enums";
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

  async updateUser(
    updatedUserData: Partial<User>,
    userId: string,
    manager?: EntityManager
  ) {
    logger.info(`🔄 Updating user with ID: ${userId}`);
    const em = manager || this.updateUserRepository.manager;
    const userData = await this.userInfoProvider.getUser({ id: userId });

    Object.assign(userData, updatedUserData);

    const updatedUser = await em.save(User, userData);

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

    logger.info(`🔍 Verifying OTP for ${userEmail}`);
    await this.otpProvider.verifyOtp({
      userEmail,
      otpCode,
      otpType: OtpType.USER,
    });

    const jwtToken = generateJwtToken({
      id: userData.id,
      userRole: UserRole.USER,
    });

    logger.info(`✅ User ${userData.userEmail} logged in successfully.`);
    return new SingleUserResponse(true, LOGIN_SUCCESSFUL, userData, jwtToken);
  }
}
