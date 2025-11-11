import { Repository } from "typeorm";
import { Service } from "typedi";

import { User } from "../../entities/User";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { MultipleUserResponse } from "../../types/responses/UserResponse";

import { logger } from "../../utils/logger";
import {
  NO_USER_FOUND,
  USER_ALREADY_EXISTS,
  USER_LIST,
} from "../../utils/messages";
import { CustomError } from "../../utils/customError";
import { PaginationDto } from "../../types/dtos/Pagination";

@Service()
export class UserInfoProvider {
  private userInfoRepository: Repository<User>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.userInfoRepository = this.repositoryFactory.getRepository(User);
  }

  async getAllUsers(params: PaginationDto): Promise<MultipleUserResponse> {
    const { page = 1, limit = 10 } = params;
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

  async checkUserExists(phoneNumber: string) {
    logger.info(`🔍 Searching for user with params: ${phoneNumber}`);

    const isExisting = await this.userInfoRepository
      .createQueryBuilder("u")
      .where("u.phone_number = :phoneNumber", { phoneNumber })
      .getExists();

    if (isExisting) {
      logger.warn(`⚠️ User with phone number: "${phoneNumber}" already exists.`);
      throw new CustomError(USER_ALREADY_EXISTS);
    }
  }

  async getUser(params: { phoneNumber?: string; id?: string, relations?: string[]}): Promise<User> {
    logger.info(
      `🔍 Searching for user with params: ${params.id || params.phoneNumber}`
    );

    const userData = await this.userInfoRepository.findOne({
      where: [{ id: params.id }, { phoneNumber: params.phoneNumber }],
      relations: params.relations || []
    });

    if (!userData) {
      logger.warn(
        `❌ No user found with phone number or id: ${
          params.phoneNumber || params.id
        }`
      );
      throw new CustomError(NO_USER_FOUND);
    }

    return userData;
  }
}
