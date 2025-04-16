import { Repository } from "typeorm";
import { Service } from "typedi";
import bcrypt from "bcryptjs";

import { Admin } from "../../entities/Admin";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { CustomError } from "../../utils/customError";
import {
  ADMIN_ALREADY_EXISTS,
  ADMIN_LOGIN_SUCCESS,
  ADMIN_NOT_FOUND,
  ADMIN_REGISTER_SUCCESS,
  INVALID_PASSWORD,
} from "../../utils/messages";
import { hashPassword } from "../../utils/hashPassword";
import { validatePassword } from "../../utils/validatePassword";
import { generateJwtToken } from "../../helpers/generateJwtToken";
import { SingleAdminResponse } from "../../types/responses/AdminResponse";
import { logger } from "../../utils/logger";

@Service()
export class AdminAuthProvider {
  private adminAuthRepository: Repository<Admin>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.adminAuthRepository = this.repositoryFactory.getRepository(Admin);
  }

  private async checkAdminExists(email: string) {
    logger.info(`🔍 Searching for admin with params: ${email}`);
    const isExisting = await this.adminAuthRepository
      .createQueryBuilder("admin")
      .where("admin.email = :email", { email })
      .getExists();

    if (isExisting) {
      logger.warn(`❌ Admin found with email: ${email}`);
      throw new CustomError(ADMIN_ALREADY_EXISTS);
    }
  }

  private async getAdminDetails(email: string) {
    logger.info(`🔍 Searching for admin with params: ${email}`);
    const adminData = await this.adminAuthRepository.findOne({
      where: { email },
    });

    if (!adminData) {
      logger.warn(`❌ No admin found with email or id: ${email}`);
      throw new CustomError(ADMIN_NOT_FOUND);
    }

    return adminData;
  }

  async registerAdmin(params: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<SingleAdminResponse> {
    logger.info(`🔄Processing register user request for : ${params.email}`);
    validatePassword(params.password);
    await this.checkAdminExists(params.email);

    const hashedPassword = await hashPassword(params.password);

    const admin = this.adminAuthRepository.create({
      fullName: params.fullName,
      email: params.email,
      password: hashedPassword,
    });

    await this.adminAuthRepository.save(admin);

    logger.info(`✅ Admin ${params.email} registered successfully.`);
    return new SingleAdminResponse(true, ADMIN_REGISTER_SUCCESS);
  }

  async loginAdmin(
    email: string,
    password: string
  ): Promise<SingleAdminResponse> {
    logger.info(`🔄Logging in user: ${email}.`);
    const adminData = await this.getAdminDetails(email);

    const isMatching = await bcrypt.compare(password, adminData.password);
    if (!isMatching) {
      throw new CustomError(INVALID_PASSWORD);
    }

    const jwtToken = generateJwtToken(
      {
        adminId: adminData.id,
        adminRole: adminData.adminRole,
      },
      "2h"
    );

    logger.info(`✅ Admin ${email} logged in successfully.`);
    return new SingleAdminResponse(true, ADMIN_LOGIN_SUCCESS, null, jwtToken);
  }
}
