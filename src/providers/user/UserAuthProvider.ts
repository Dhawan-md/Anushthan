import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { UserInfoProvider } from "./UserInfoProvider";
import { OtpProvider } from "../otp/OtpProvider";

import { User } from "../../entities/User";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { generateJwtToken } from "../../helpers/generateJwtToken";
import { uploadFiles } from "../../helpers/uploadS3Files";

import { sendEmail } from "../../service/email/sendEmail";

import { SingleUserResponse } from "../../types/responses/UserResponse";

import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import {
  LOGIN_REQUESTED,
  LOGIN_SUCCESSFUL,
  OTP_GENERATION_FAILED,
  PHONE_NUMBER_REQUIRED,
  USER_REGISTERED,
} from "../../utils/messages";
import { EmailType, OtpType, S3BucketType, UserRole } from "../../utils/enums";
import { validateEmail } from "../../utils/validateEmail";
import {
  LoginUserDto,
  RegisterUserDto,
  VerifyUserDto,
} from "../../types/dtos/User";

@Service()
export class UserAuthProvider {
  private userAuthRepository: Repository<User>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider,
    @Inject(() => OtpProvider) private otpProvider: OtpProvider
  ) {
    this.userAuthRepository = this.repositoryFactory.getRepository(User);
  }

  async registerUser(params: RegisterUserDto): Promise<SingleUserResponse> {
    logger.info(`🔄Processing register user request for : ${params.userEmail}`);
    validateEmail(params.userEmail);

    await this.userInfoProvider.checkUserExists(params.userEmail);
    if (!params.phoneNumber || params.phoneNumber.trim() === "") {
      throw new CustomError(PHONE_NUMBER_REQUIRED);
    }

    let uploadedImages: { filePath: string }[] | { filePath: string } = [];

    if (params.profileImage) {
      uploadedImages = await uploadFiles(
        params.profileImage,
        S3BucketType.IMAGE
      );
    }

    return await this.userAuthRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const newUser = await transactionalEntityManager.save(User, {
          name: params.name,
          username: params.username,
          userEmail: params.userEmail.trim().toLowerCase(),
          phoneNumber: params.phoneNumber,
          profileImage: JSON.stringify(
            uploadedImages.map((images) => images.filePath)
          ),
        });

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
        return new SingleUserResponse(true, USER_REGISTERED, newUser);
      }
    );
  }

  async loginUser(params: LoginUserDto): Promise<SingleUserResponse> {
    const { userEmail } = params;

    logger.info(`🔄Logging in user: ${userEmail}.`);
    validateEmail(userEmail);

    const userData = await this.userInfoProvider.getUser({ userEmail });

    const otp = await this.otpProvider.generateAndSaveNewOtp(
      userEmail,
      OtpType.USER
    );

    await sendEmail(
      userEmail,
      {
        name: userData.name,
        otpCode: otp.otpCode,
      },
      EmailType.ACCOUNT_VERIFICATION
    );

    logger.info(`✅ User with ${userEmail} logged in requested.`);

    return new SingleUserResponse(true, LOGIN_REQUESTED);
  }

  async verifyUser(params: VerifyUserDto): Promise<SingleUserResponse> {
    const { userEmail, otpCode } = params;
    
    logger.info(`🔄 Verification request received for: ${userEmail}`);
    
    const userData = await this.userInfoProvider.getUser({
      userEmail,
    });

    logger.info(`🔍 Verifying OTP for ${userEmail}`);
    await this.otpProvider.verifyOtp({
      userEmail,
      otpCode,
      otpType: OtpType.USER,
    });

    const jwtToken = generateJwtToken({
      id: userData.id,
      userRole: UserRole.USER,
    });

    logger.info(`✅ User ${userData.userEmail} logged in successfully.`);
    return new SingleUserResponse(true, LOGIN_SUCCESSFUL, userData, jwtToken);
  }
}
