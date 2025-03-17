import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import bcrypt from "bcryptjs";

import { User } from "../../entities/User";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { SingleUserResponse } from "../../types/responses/UserResponse";
import { logger } from "../../utils/logger";
import { validatePassword } from "../../helpers/validatePassword";
import { UserInfoProvider } from "./UserInfoProvider";
import { CustomError } from "../../utils/custumError";
import {
  USER_EMAIL_ALREADY_EXISTS,
  USER_REGISTERED,
} from "../../utils/messages";
import { generateJwtToken } from "../../helpers/generateJwtToken";

@Service()
export class UserSignInProvider {
  private userSignInRepository: Repository<User>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider
  ) {
    this.userSignInRepository = this.repositoryFactory.getRepository(User);
  }

  async registerUser(params: {
    name: string;
    username: string;
    userEmail: string;
    password: string;
  }): Promise<SingleUserResponse> {
    logger.info(`🔄Processing register user request for : ${params.userEmail}`);
    validatePassword(params.password);

    const isExistingUser = await this.userInfoProvider.getUser({
      userEmail: params.userEmail,
    });

    if (isExistingUser) {
      throw new CustomError(USER_EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(params.password, 10);
    const newUser = this.userSignInRepository.create({
      name: params.name,
      username: params.username,
      email: params.userEmail,
      password: hashedPassword,
    });
    const user = await this.userSignInRepository.save(newUser);

    const jwtToken = generateJwtToken({
      userId: user.id,
      isVerified: user.isVerified,
      userRole: user.userRole,
    });

    logger.info(`✅ User ${user.id} registered successfully.`);
    return new SingleUserResponse(true, USER_REGISTERED, user, jwtToken);
  }
}
