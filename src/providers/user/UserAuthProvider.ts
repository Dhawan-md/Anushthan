import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { UserInfoProvider } from "./UserInfoProvider";
import { OtpProvider } from "../otp/OtpProvider";

import { User } from "../../entities/User";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { generateJwtToken } from "../../helpers/generateJwtToken";
import { uploadFiles } from "../../helpers/uploadS3Files";

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
import { OtpType, S3BucketType, UserRole } from "../../utils/enums";
import { validateEmail } from "../../utils/validateEmail";
import {
  LoginUserDto,
  RegisterUserDto,
  VerifyUserDto,
} from "../../types/dtos/User";
import { sendOtpSMS } from "../../service/sms/sendOtpSms";

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
    const { userEmail, username, name, phoneNumber, profileImage } = params;
    logger.info(`🔄Processing register user request for : ${userEmail}`);
    validateEmail(userEmail);

    await this.userInfoProvider.checkUserExists(userEmail);
    if (!phoneNumber || phoneNumber.trim() === "") {
      throw new CustomError(PHONE_NUMBER_REQUIRED);
    }

    let uploadedImages: { filePath: string }[] | { filePath: string } = [];

    if (profileImage) {
      uploadedImages = await uploadFiles(profileImage, S3BucketType.IMAGE);
    }

    return await this.userAuthRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const newUser = await transactionalEntityManager.save(User, {
          name: name,
          username: username,
          userEmail: userEmail.trim().toLowerCase(),
          phoneNumber: phoneNumber,
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

        await sendOtpSMS(phoneNumber, otpData.data.otpCode);

        logger.info(`✅ User ${newUser.id} registered successfully.`);
        return new SingleUserResponse(true, USER_REGISTERED, newUser);
      }
    );
  }

  async loginUser(params: LoginUserDto): Promise<SingleUserResponse> {
    const { phoneNumber } = params;

    logger.info(`🔄Logging in user: ${phoneNumber}.`);

    const otp = await this.otpProvider.generateAndSaveNewOtp(
      phoneNumber,
      OtpType.USER
    );

    await sendOtpSMS(phoneNumber, otp.otpCode);

    logger.info(
      `✅ User with phone number ${phoneNumber} logged in requested.`
    );

    return new SingleUserResponse(true, LOGIN_REQUESTED);
  }

  async verifyUser(params: VerifyUserDto): Promise<SingleUserResponse> {
    const { phoneNumber, otpCode } = params;
    logger.info(`🔄 Verification request received for: ${phoneNumber}`);

    const userData = await this.userInfoProvider.getUser({
      phoneNumber,
    });

    logger.info(`🔍 Verifying OTP for ${phoneNumber}`);
    await this.otpProvider.verifyOtp({
      phoneNumber,
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
