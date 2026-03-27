import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { UserInfoService } from "./UserInfoService";
import { OtpService } from "../otp/OtpService";

import { User } from "../../entities/User";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { S3Service } from "../../infrastructure/aws/S3Service";

import { SingleUserResponse } from "../../types/responses/UserResponse";

import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import {
  LOGIN_REQUESTED,
  LOGIN_SUCCESSFUL,
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
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../helpers/generateJwtToken";
import { UpdateUserService } from "./UpdateUserService";
import { verifyRefreshToken } from "../../helpers/verifyJwtToken";
import { TokenResponse } from "../../types/responses/TokenResponse";
import admin from "../../config/firebase";

@Service()
export class UserAuthService {
  private userAuthRepository: Repository<User>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoService) private userInfoService: UserInfoService,
    @Inject(() => UpdateUserService)
    private updateUserService: UpdateUserService,
    @Inject(() => OtpService) private otpService: OtpService,
    @Inject(() => S3Service) private s3Service: S3Service
  ) {
    this.userAuthRepository = this.repositoryFactory.getRepository(User);
  }

  async registerUser(params: RegisterUserDto): Promise<SingleUserResponse> {
    const { userEmail, name, phoneNumber, profileImage, deviceToken } = params;
    logger.info(`🔄Processing register user request for : ${userEmail}`);
    validateEmail(userEmail);

    await this.userInfoService.checkUserExists(phoneNumber);

    if (!phoneNumber || phoneNumber.trim() === "") {
      throw new CustomError(PHONE_NUMBER_REQUIRED);
    }

    let uploadedImages: { filePath: string }[] | { filePath: string } = [];

    if (profileImage) {
      uploadedImages = await this.s3Service.uploadFiles(profileImage, S3BucketType.IMAGE);
    }

    return await this.userAuthRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const newUser = await transactionalEntityManager.save(User, {
          name: name,
          userEmail: userEmail.trim().toLowerCase(),
          phoneNumber: phoneNumber,
          deviceToken: deviceToken,
          profileImage: JSON.stringify(
            (Array.isArray(uploadedImages) ? uploadedImages : [uploadedImages]).map((images) => images.filePath)
          ),
        });

        logger.info(`✅ User ${newUser.id} registered successfully.`);
        return new SingleUserResponse(true, USER_REGISTERED, newUser, null, null, newUser.deviceToken);
      }
    );
  }

  async loginUser(params: LoginUserDto): Promise<SingleUserResponse> {
    const { phoneNumber } = params;

    logger.info(`🔄Logging in user: ${phoneNumber}.`);

    const user = await this.userInfoService.getUser({ phoneNumber });

    await this.userAuthRepository.manager.transaction(async (transactionalEntityManager) => {
      await this.otpService.saveOtp(user, transactionalEntityManager);
    });

    return new SingleUserResponse(true, LOGIN_REQUESTED);
  }

  async verifyUser(params: VerifyUserDto): Promise<SingleUserResponse> {
    const { phoneNumber, otpCode, idToken, deviceToken } = params;
    logger.info(`🔄 Verification request received for: ${phoneNumber}`);

    if (idToken) {
      logger.info(`🔍 Verifying Firebase Token for ${phoneNumber}`);
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebasePhoneNumber = decodedToken.phone_number;

        // Strip +91 if necessary or handle format
        if (firebasePhoneNumber !== phoneNumber) {
          logger.warn(`⚠️ Token phone number mismatch: ${firebasePhoneNumber} vs ${phoneNumber}`);
          // Optional: handle mismatch or trust firebasePhoneNumber
        }
      } catch (error) {
        logger.error(`❌ Firebase token verification failed: ${error}`);
        throw new CustomError("Invalid Firebase token.");
      }
    } else if (otpCode) {
      logger.info(`🔍 Verifying Local OTP for ${phoneNumber}`);
      await this.otpService.verifyOtp({
        phoneNumber,
        otpCode,
        otpType: OtpType.USER,
      });
    } else {
      throw new CustomError("OTP code or Firebase token is required.");
    }

    const userData = await this.userInfoService.getUser({
      phoneNumber,
    });

    const accessToken = generateAccessToken({
      id: userData.id,
      userRole: UserRole.USER,
    });
    const refreshToken = generateRefreshToken({ id: userData.id });

    await this.updateUserService.updateUser({
      updatedUserData: {
        refreshToken: refreshToken.token,
        ...(deviceToken && { deviceToken }),
      },
      userId: userData.id,
    });

    logger.info(`✅ User ${userData.userEmail} logged in successfully.`);
    return new SingleUserResponse(
      true,
      LOGIN_SUCCESSFUL,
      userData,
      accessToken,
      refreshToken,
      deviceToken || userData.deviceToken
    );
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) throw new CustomError("Invalid or expired refresh token");

    const user = await this.userInfoService.getUser({ id: payload.id });
    if (!user) throw new CustomError("User not found");

    // Optional: verify stored token matches
    if (user.refreshToken !== refreshToken) {
      throw new CustomError("Token mismatch or revoked");
    }

    // Issue new tokens
    const newAccessToken = generateAccessToken({
      id: user.id,
      userRole: UserRole.USER,
    });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    // Save new refresh token (rotation)
    user.refreshToken = newRefreshToken.token;
    await this.updateUserService.updateUser({
      updatedUserData: { refreshToken: newRefreshToken.token },
      userId: user.id,
    });

    return {
      success: true,
      message: "Tokens refreshed successfully",
      accessToken: {
        token: newAccessToken.token,
        expiresIn: newAccessToken.expiresIn,
      }, // 15 min
      refreshToken: {
        token: newRefreshToken.token,
        expiresIn: newRefreshToken.expiresIn,
      }, // 7 days
    };
  }
}
