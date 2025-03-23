import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import bcrypt from "bcryptjs";

import { User } from "../../entities/User";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { SingleUserResponse } from "../../types/responses/UserResponse";
import { logger } from "../../utils/logger";
import { validatePassword } from "../../utils/validatePassword";
import { UserInfoProvider } from "./UserInfoProvider";
import { CustomError } from "../../utils/customError";
import {
  INVALID_PASSWORD,
  LOGIN_SUCCESSFUL,
  OTP_GENERATION_FAILED,
  USER_EMAIL_ALREADY_EXISTS,
  USER_REGISTERED,
} from "../../utils/messages";
import { generateJwtToken } from "../../helpers/generateJwtToken";
import { OtpProvider } from "../otp/OtpProvider";
import { sendEmail } from "../../service/email/sendEmail";
import { EmailType, S3BucketType } from "../../utils/enums";
import { FileUpload } from "graphql-upload-minimal";
import { uploadFiles } from "../../helpers/uploadS3Files";
import { validateEmail } from "../../utils/validateEmail";
import { hashPassword } from "../../utils/hashPassword";

@Service()
export class UserSignInProvider {
  private userSignInRepository: Repository<User>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider,
    @Inject(() => OtpProvider) private otpProvider: OtpProvider
  ) {
    this.userSignInRepository = this.repositoryFactory.getRepository(User);
  }

  async registerUser(params: {
    name: string;
    username: string;
    userEmail: string;
    password: string;
    phoneNumber: string;
    profileImage?: FileUpload | null;
  }): Promise<SingleUserResponse> {
    logger.info(`🔄Processing register user request for : ${params.userEmail}`);
    validatePassword(params.password);
    validateEmail(params.userEmail);

    const isExistingUser = await this.userInfoProvider.findUser(
      params.userEmail
    );

    if (isExistingUser) {
      throw new CustomError(USER_EMAIL_ALREADY_EXISTS);
    }
    let uploadedImage;

    if (params.profileImage) {
      uploadedImage = await uploadFiles(
        params.profileImage,
        S3BucketType.IMAGE
      );
    }

    const hashedPassword = await hashPassword(params.password);
    return await this.userSignInRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const newUser = await transactionalEntityManager.save(User, {
          name: params.name,
          username: params.username,
          userEmail: params.userEmail,
          password: hashedPassword,
          phoneNumber: params.phoneNumber,
          profilePic: uploadedImage || null,
        });

        const jwtToken = generateJwtToken(
          {
            userId: newUser.id,
            isVerified: newUser.isVerified,
            userRole: newUser.userRole,
          },
          "24h"
        );

        const otpData = await this.otpProvider.saveOtp(
          newUser,
          transactionalEntityManager
        );

        if (!otpData.data || !otpData.success) {
          throw new CustomError(OTP_GENERATION_FAILED);
        }

        await sendEmail(
          params.userEmail,
          {
            name: params.name,
            otpCode: otpData.data?.otpCode,
          },
          EmailType.ACCOUNT_VERIFICATION
        );
        logger.info(`✅ User ${newUser.id} registered successfully.`);
        return new SingleUserResponse(true, USER_REGISTERED, newUser, jwtToken);
      }
    );
  }

  async loginUser(
    userEmail: string,
    password: string
  ): Promise<SingleUserResponse> {
    logger.info(`🔄Logging in user: ${userEmail}.`);
    validateEmail(userEmail);

    const userData = await this.userInfoProvider.getUser({ userEmail });

    const isValidPassword = await bcrypt.compare(password, userData.password);

    if (!isValidPassword) {
      throw new CustomError(INVALID_PASSWORD);
    }

    const jwtToken = generateJwtToken(
      {
        userId: userData.id,
        isVerified: userData.isVerified,
        userRole: userData.userRole,
      },
      "24h"
    );

    logger.info(`✅ User ${userData.username} logged in successfully.`);

    return new SingleUserResponse(true, LOGIN_SUCCESSFUL, userData, jwtToken);
  }
}
