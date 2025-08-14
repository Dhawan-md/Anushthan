import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { UserInfoProvider } from "./UserInfoProvider";

import { User } from "../../entities/User";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleUserResponse } from "../../types/responses/UserResponse";

import { logger } from "../../utils/logger";
import { NO_DATA_TO_UPDATE, USER_UPDATED } from "../../utils/messages";
import { CustomError } from "../../utils/customError";

@Service()
export class UpdateUserProvider {
  private updateUserRepository: Repository<User>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider
  ) {
    this.updateUserRepository = this.repositoryFactory.getRepository(User);
  }

  async updateUser(params: {
    updatedUserData: Partial<User>;
    userId: string;
    manager?: EntityManager;
  }) {
    const { updatedUserData, userId, manager } = params;
    logger.info(`🔄 Updating user with ID: ${userId}`);
    if (Object.keys(updatedUserData).length === 0) {
      logger.warn(`⚠️ No fields provided to update for user ${userId}`);
      throw new CustomError(NO_DATA_TO_UPDATE);
    }

    const em = manager || this.updateUserRepository.manager;
    const userData = await this.userInfoProvider.getUser({ id: userId });

    Object.assign(userData, updatedUserData);

    const updatedUser = await em.save(User, userData);

    logger.info(
      `📝 Fields updated for user ${userId}: ${Object.keys(
        updatedUserData
      ).join(", ")}`
    );
    logger.info(`✅ Successfully updated user with ID: ${userId}`);
    return new SingleUserResponse(true, USER_UPDATED, updatedUser);
  }
}
