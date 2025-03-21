import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import bcrypt from "bcryptjs";

import { User } from "../../entities/User";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { SingleUserResponse } from "../../types/responses/UserResponse";
import { logger } from "../../utils/logger";
import { validatePassword } from "../../utils/validatePassword";
import { UserInfoProvider } from "./UserInfoProvider";
import { CustomError } from "../../utils/custumError";
import {
  INVALID_PASSWORD,
  LOGIN_SUCCESSFULL,
  NO_USER_FOUND,
  OTP_GENERATION_FAILED,
  USER_EMAIL_ALREADY_EXISTS,
  USER_REGISTERED,
} from "../../utils/messages";
import { generateJwtToken } from "../../helpers/generateJwtToken";
import { OtpProvider } from "../otp/OtpProvider";
import { sendEmail } from "../../service/email/sendEmail";
import { EmailType, s3BucketType } from "../../utils/enums";
import { FileUpload } from "graphql-upload-minimal";
import { uploadFiles } from "../../helpers/uploadFiles";
import { validateEmail } from "../../utils/validateEmail";

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
    profileImage: FileUpload;
  }): Promise<SingleUserResponse> {
    logger.info(`🔄Processing register user request for : ${params.userEmail}`);
    validatePassword(params.password);
    validateEmail(params.userEmail);

    const isExistingUser = await this.userInfoProvider.getUser({
      userEmail: params.userEmail,
    });

    if (isExistingUser) {
      throw new CustomError(USER_EMAIL_ALREADY_EXISTS);
    }

    const uploadedImage = await uploadFiles(
      params.profileImage,
      s3BucketType.IMAGE
    );

    const hashedPassword = await bcrypt.hash(params.password, 10);
    const newUser = this.userSignInRepository.create({
      name: params.name,
      username: params.username,
      userEmail: params.userEmail,
      password: hashedPassword,
      phoneNumber: params.phoneNumber,
      profile_pic: JSON.stringify(uploadedImage),
    });
    const user = await this.userSignInRepository.save(newUser);

    const jwtToken = generateJwtToken(
      {
        userId: user.id,
        isVerified: user.isVerified,
        userRole: user.userRole,
      },
      "24h"
    );

    const otpData = await this.otpProvider.saveOtp(user);

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

    logger.info(`✅ User ${user.id} registered successfully.`);
    return new SingleUserResponse(true, USER_REGISTERED, user, jwtToken);
  }

  async loginUser(
    emailOrUsername: string,
    password: string
  ): Promise<SingleUserResponse> {
    logger.info(`🔄Logging in user: ${emailOrUsername}.`);
    validateEmail(emailOrUsername);

    const userData = await this.userSignInRepository.findOneBy([
      { userEmail: emailOrUsername },
      { username: emailOrUsername },
    ]);

    if (!userData) {
      throw new CustomError(NO_USER_FOUND);
    }

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

    return new SingleUserResponse(true, LOGIN_SUCCESSFULL, userData, jwtToken);
  }
}
