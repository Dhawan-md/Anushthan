import { Repository } from "typeorm";
import { Service } from "typedi";

import { User } from "../../entities/User";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";
import { MultipleUserResponse } from "../../types/responses/UserResponse";
import {
  NO_USER_FOUND,
  USER_ALREADY_EXISTS,
  USER_LIST,
} from "../../utils/messages";
import { CustomError } from "../../utils/customError";

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

    const totalPages = Math.ceil(total / limit);

    logger.info(`✅ Retrieved ${userList.length} users from the database.`);
    return new MultipleUserResponse(
      true,
      USER_LIST,
      userList,
      total,
      page,
      limit,
      totalPages
    );
  }

  async checkUserExists(userEmail: string) {
    const normalizedEmail = userEmail.trim().toLowerCase();
    logger.info(`🔍 Searching for user with params: ${normalizedEmail}`);

    const isExisting = await this.userInfoRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { normalizedEmail })
      .getExists();

    if (isExisting) {
      logger.warn(`⚠️ User with email "${userEmail}" already exists.`);
      throw new CustomError(USER_ALREADY_EXISTS);
    }
  }

  async getUser(params: { userEmail?: string; id?: string }): Promise<User> {
    const normalizedEmail = params.userEmail?.trim().toLowerCase();
    logger.info(
      `🔍 Searching for user with params: ${params.id || normalizedEmail}`
    );

    const userData = await this.userInfoRepository.findOne({
      where: [{ id: params.id }, { userEmail: normalizedEmail }],
    });

    if (!userData) {
      logger.warn(
        `❌ No user found with email or id: ${normalizedEmail || params.id}`
      );
      throw new CustomError(NO_USER_FOUND);
    }

    return userData;
  }
}
