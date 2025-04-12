import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { User } from "../../entities/User";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { SingleUserResponse } from "../../types/responses/UserResponse";
import { logger } from "../../utils/logger";
import { UserInfoProvider } from "./UserInfoProvider";
import { CustomError } from "../../utils/customError";
import {
  LOGIN_SUCCESSFUL,
  OTP_GENERATION_FAILED,
  PHONE_NUMBER_REQUIRED,
  USER_REGISTERED,
} from "../../utils/messages";
import { OtpProvider } from "../otp/OtpProvider";
import { sendEmail } from "../../service/email/sendEmail";
import { EmailType, OtpType, S3BucketType } from "../../utils/enums";
import { FileUpload } from "graphql-upload-minimal";
import { uploadFiles } from "../../helpers/uploadS3Files";
import { validateEmail } from "../../utils/validateEmail";

@Service()
export class UserAuthProvider {
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
    phoneNumber: string;
    profileImage?: FileUpload | null;
  }): Promise<SingleUserResponse> {
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

    return await this.userSignInRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const newUser = await transactionalEntityManager.save(User, {
          name: params.name,
          username: params.username,
          userEmail: params.userEmail.toLowerCase(),
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

  async loginUser(userEmail: string): Promise<SingleUserResponse> {
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

    logger.info(`✅ User ${userData.userEmail} logged in requested.`);

    return new SingleUserResponse(true, LOGIN_SUCCESSFUL);
  }
}
