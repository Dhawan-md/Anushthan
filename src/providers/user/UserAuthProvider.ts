import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { UserInfoProvider } from "./UserInfoProvider";
import { OtpProvider } from "../otp/OtpProvider";

import { User } from "../../entities/User";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

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
import { OtpType, UserRole } from "../../utils/enums";
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
import { UpdateUserProvider } from "./UpdateUserProvider";
import { verifyRefreshToken } from "../../helpers/verifyJwtToken";
import { TokenResponse } from "../../types/responses/TokenResponse";
import { sendOtpPush } from "../../service/fcm/sendPushOtp";

@Service()
export class UserAuthProvider {
  private userAuthRepository: Repository<User>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider,
    @Inject(() => UpdateUserProvider)
    private updateUserProvider: UpdateUserProvider,
    @Inject(() => OtpProvider) private otpProvider: OtpProvider
  ) {
    this.userAuthRepository = this.repositoryFactory.getRepository(User);
  }

  async registerUser(params: RegisterUserDto): Promise<SingleUserResponse> {
    const { userEmail, name, phoneNumber, deviceToken } = params;
    logger.info(`🔄Processing register user request for : ${userEmail}`);
    validateEmail(userEmail);

    await this.userInfoProvider.checkUserExists(phoneNumber);

    if (!phoneNumber || phoneNumber.trim() === "") {
      throw new CustomError(PHONE_NUMBER_REQUIRED);
    }

    return await this.userAuthRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const newUser = await transactionalEntityManager.save(User, {
          name: name,
          userEmail: userEmail.trim().toLowerCase(),
          phoneNumber: phoneNumber,
          deviceToken,
        });

        const otpData = await this.otpProvider.saveOtp(
          newUser,
          transactionalEntityManager
        );

        if (!otpData.data || !otpData.success) {
          throw new CustomError(OTP_GENERATION_FAILED);
        }

        // await sendOtpSMS(phoneNumber, otpData.data.otpCode);
        await sendOtpPush(deviceToken, otpData.data.otpCode);

        logger.info(`✅ User ${newUser.id} registered successfully.`);
        return new SingleUserResponse(true, USER_REGISTERED, newUser);
      }
    );
  }

  async loginUser(params: LoginUserDto): Promise<SingleUserResponse> {
    const {
      phoneNumber,
      // deviceToken
    } = params;

    logger.info(`🔄Logging in user: ${phoneNumber}.`);

    await this.otpProvider.generateAndSaveNewOtp(phoneNumber, OtpType.USER);

    // await sendOtpPush(deviceToken, otp.otpCode);

    logger.info(
      `✅ User with phone number ${phoneNumber} logged in requested.`
    );

    return new SingleUserResponse(true, LOGIN_REQUESTED);
  }

  async verifyUser(params: VerifyUserDto): Promise<SingleUserResponse> {
    const { phoneNumber, otpCode, deviceToken } = params;
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

    const accessToken = generateAccessToken({
      id: userData.id,
      userRole: UserRole.USER,
    });

    const refreshToken = generateRefreshToken({ id: userData.id });

    await this.updateUserProvider.updateUser({
      updatedUserData: { refreshToken: refreshToken.token, deviceToken },
      userId: userData.id,
    });

    logger.info(`✅ User ${userData.userEmail} logged in successfully.`);
    return new SingleUserResponse(
      true,
      LOGIN_SUCCESSFUL,
      userData,
      accessToken,
      refreshToken
    );
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) throw new CustomError("Invalid or expired refresh token");

    const user = await this.userInfoProvider.getUser({ id: payload.id });
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
    await this.updateUserProvider.updateUser({
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
