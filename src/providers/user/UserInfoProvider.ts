import { Repository } from "typeorm";
import { Service } from "typedi";

import { User } from "../../entities/User";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";
import { MultipleUserResponse } from "../../types/responses/UserResponse";
import { USER_LIST } from "../../utils/messages";

@Service()
export class UserInfoProvider {
  private userInfoRepository: Repository<User>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.userInfoRepository = this.repositoryFactory.getRepository(User);
  }

  async getAllUsers(): Promise<MultipleUserResponse> {
    logger.info("🔄 Fetching all users...");
    const userList = await this.userInfoRepository.find();

    logger.info(`✅ Retrieved ${userList.length} users from the database.`);
    return new MultipleUserResponse(true, USER_LIST, userList);
  }

  async getUser(params: {
    username?: string;
    userEmail?: string;
    userId?: string;
  }): Promise<User | null> {
    logger.info(
      `🔍 Searching for user with params: ${
        params.username || params.userId || params.userEmail
      }`
    );
    return await this.userInfoRepository.findOne({ where: params });
  }
}
