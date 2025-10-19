import { Repository } from "typeorm";
import { Inject, Service } from "typedi";
import bcrypt from "bcryptjs";

import { Admin } from "../../entities/Admin";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { CustomError } from "../../utils/customError";
import {
  ADMIN_LOGIN_SUCCESS,
  ADMIN_REGISTER_SUCCESS,
  INVALID_PASSWORD,
} from "../../utils/messages";
import { hashPassword } from "../../utils/hashPassword";
import { validatePassword } from "../../utils/validatePassword";
import { SingleAdminResponse } from "../../types/responses/AdminResponse";
import { logger } from "../../utils/logger";
import { AdminInfoProvider } from "./AdminInfoProvider";
import { LoginAdminDto, RegisterAdminDto } from "../../types/dtos/Admin";
import { generateAccessToken } from "../../helpers/generateJwtToken";

@Service()
export class AdminAuthProvider {
  private adminAuthRepository: Repository<Admin>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => AdminInfoProvider)
    private readonly adminInfoProvider: AdminInfoProvider
  ) {
    this.adminAuthRepository = this.repositoryFactory.getRepository(Admin);
  }

  async registerAdmin(params: RegisterAdminDto): Promise<SingleAdminResponse> {
    const { fullName, email, password } = params;
    logger.info(`🔄Processing register admin request for email : ${email}`);

    validatePassword(password);
    await this.adminInfoProvider.checkAdminExists(email);

    const hashedPassword = await hashPassword(password);

    const admin = this.adminAuthRepository.create({
      fullName: fullName,
      email,
      password: hashedPassword,
    });

    await this.adminAuthRepository.save(admin);

    logger.info(
      `✅ Admin with email: ${params.email} registered successfully.`
    );
    return new SingleAdminResponse(true, ADMIN_REGISTER_SUCCESS);
  }

  async loginAdmin(params: LoginAdminDto): Promise<SingleAdminResponse> {
    const { email, password } = params;
    logger.info(`🔄Logging in admin with email: ${email}.`);
    
    const adminData = await this.adminInfoProvider.getAdminDetails(email);

    const isValidPassword = await bcrypt.compare(password, adminData.password);
    if (!isValidPassword) {
      throw new CustomError(INVALID_PASSWORD);
    }

    const accessToken = generateAccessToken({ adminId: adminData.id, adminRole: adminData.adminRole });

    logger.info(`✅ Admin with email: ${email} logged in successfully.`);
    return new SingleAdminResponse(true, ADMIN_LOGIN_SUCCESS, null, accessToken);
  }
}
