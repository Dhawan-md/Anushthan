// import { Inject, Service } from "typedi";
// import { Repository } from "typeorm";
// import bcrypt from "bcryptjs";


// import { User } from "../entities/User";
// import { RepositoryFactory } from "../factories/RepositoryFactory";
// import { SingleUserResponse } from "../types/responses/UserResponse";
// import { logger } from "../utils/logger";
// import { validatePassword } from "../helpers/validatePassword";
// import { UserInfoProvider } from "./UserInfoProvider";
// import { CustomError } from "../utils/custumError";
// import { USER_EMAIL_ALREADY_EXISTS } from "../utils/messages";

// @Service()
// export class UserSignInProvider {
//   private userSignInRepository: Repository<User>;

//   constructor(
//     private repositoryFactory: RepositoryFactory,
//     @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider
//   ) {
//     this.userSignInRepository = this.repositoryFactory.getRepository(User);
//   }

//   async registerUser(params: {
//     name: string;
//     username: string;
//     email: string;
//     password: string;
//   }): SingleUserResponse {
//     logger.info(`🔄Processing register user request for : ${params.email}`);
//     validatePassword(params.password);

//     const isExistingUser = await this.userInfoProvider.getUser({
//       email: params.email,
//     });

//     if (isExistingUser) {
//       throw new CustomError(USER_EMAIL_ALREADY_EXISTS);
//     }

//     const hashedPassword = await bcrypt.hash(params.password, 10);
//     const newUser = this.userRepository.create({
//       name: params.name,
//       username: params.username,
//       email: params.email,
//       password: hashedPassword,
//     });
//     const user = await this.userRepository.save(newUser);

//     const jwtToken = this.generateJwtToken({
//       userId: user.userId,
//       isVerified: user.isVerified,
//       userType: user.userType,
//     });

//   }
// }
