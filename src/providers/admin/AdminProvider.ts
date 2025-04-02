import { Repository } from "typeorm";
import { Service } from "typedi";
import bycrpt from "bcryptjs";

import { Admin } from "../../entities/Admin";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
// import { AdminRole } from "../../utils/enums";
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

@Service()
export class AdminProvider {
  private adminRepository: Repository<Admin>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.adminRepository = this.repositoryFactory.getRepository(Admin);
  }

  private async getAdminDetailes(email: string) {
    const adminData = await this.adminRepository.findOne({
      where: { email },
    });

    return adminData;
  }

  async registerAdmin(params: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<SingleAdminResponse> {
    const adminData = await this.getAdminDetailes(params.email);

    if (adminData) {
      throw new CustomError(ADMIN_ALREADY_EXISTS);
    }

    validatePassword(params.password);
    const hashedPassword = await hashPassword(params.password);

    const admin = this.adminRepository.create({
      fullName: params.fullName,
      email: params.email,
      password: hashedPassword,
    });

    await this.adminRepository.save(admin);

    return new SingleAdminResponse(true, ADMIN_REGISTER_SUCCESS);
  }

  async loginAdmin(
    email: string,
    password: string
  ): Promise<SingleAdminResponse> {
    const adminData = await this.getAdminDetailes(email);

    if (!adminData) {
      throw new CustomError(ADMIN_NOT_FOUND);
    }

    const isMatching = await bycrpt.compare(password, adminData.password);
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

    return new SingleAdminResponse(true, ADMIN_LOGIN_SUCCESS, null, jwtToken);
  }
}
