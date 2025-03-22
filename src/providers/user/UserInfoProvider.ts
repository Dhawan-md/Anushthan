import { Repository } from "typeorm";
import { Service } from "typedi";

import { User } from "../../entities/User";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";
import { MultipleUserResponse } from "../../types/responses/UserResponse";
import { NO_USER_FOUND, USER_LIST } from "../../utils/messages";
import { CustomError } from "../../utils/custumError";

@Service()
export class UserInfoProvider {
  private userInfoRepository: Repository<User>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.userInfoRepository = this.repositoryFactory.getRepository(User);
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10
  ): Promise<MultipleUserResponse> {
    logger.info(`🔄 Fetching users for page ${page} with limit ${limit}`);

    const [userList, total] = await this.userInfoRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    logger.info(`✅ Retrieved ${userList.length} users from the database.`);
    return new MultipleUserResponse(true, USER_LIST, userList, total);
  }

  async getUser(params: { userEmail?: string; id?: string }): Promise<User> {
    logger.info(
      `🔍 Searching for user with params: ${params.id || params.userEmail}`
    );
    const userData = await this.userInfoRepository.findOne({ where: params });

    if (!userData) {
      logger.warn(
        `❌ No user found with email or id: ${params.userEmail || params.id}`
      );
      throw new CustomError(NO_USER_FOUND);
    }

    return userData;
  }
}
