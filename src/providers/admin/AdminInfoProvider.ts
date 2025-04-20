import { Service } from "typedi";
import { Repository } from "typeorm";

import { Admin } from "../../entities/Admin";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";
import { ADMIN_ALREADY_EXISTS, ADMIN_NOT_FOUND } from "../../utils/messages";
import { CustomError } from "../../utils/customError";

@Service()
export class AdminInfoProvider {
  private adminInfoRepository: Repository<Admin>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.adminInfoRepository = this.repositoryFactory.getRepository(Admin);
  }

    async checkAdminExists(email: string) {
      const normalizedEmail = email.trim().toLowerCase();
      logger.info(`🔍 Searching for admin with email: ${normalizedEmail}`);
      const isExisting = await this.adminInfoRepository
        .createQueryBuilder("admin")
        .where("admin.email = :email", { email: normalizedEmail })
        .getExists();
  
      if (isExisting) {
        logger.warn(`❌ Admin found with email: ${normalizedEmail}`);
        throw new CustomError(ADMIN_ALREADY_EXISTS);
      }
    }
  
    async getAdminDetails(email: string) {
      const normalizedEmail = email.trim().toLowerCase();
      logger.info(`🔍 Getting Data for admin with email: ${normalizedEmail}`);
      const adminData = await this.adminInfoRepository.findOne({
        where: { email: normalizedEmail },
      });
  
      if (!adminData) {
        logger.warn(`❌ No admin found with email or id: ${normalizedEmail}`);
        throw new CustomError(ADMIN_NOT_FOUND);
      }
  
      return adminData;
    }
}
