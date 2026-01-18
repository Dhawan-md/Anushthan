import { Inject, Service } from "typedi";
import { EntityManager, Repository } from "typeorm";

import { UserInfoProvider } from "./UserInfoProvider";

import { User } from "../../entities/User";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { SingleUserResponse } from "../../types/responses/UserResponse";

import { logger } from "../../utils/logger";
import {
  NO_DATA_TO_UPDATE,
  OTP_SENT,
  USER_UPDATED,
} from "../../utils/messages";
import { CustomError } from "../../utils/customError";
import { UpdatedUserInput } from "../../types/inputTypes/user/UpdateUserInput";
import { SendUpdateOtpResponse } from "../../types/responses/OtpResponse";
import { generateRedisOtpKey } from "../../utils/generateRedisOtpKey";
import { generateUserSecret } from "../../helpers/generateUserSecret";
import { generateOtp } from "../../helpers/generateOtp";
import redis from "../../config/redis";
// import { sendOtpSMS } from "../../service/sms/sendOtpSms";

@Service()
export class UpdateUserProvider {
  private updateUserRepository: Repository<User>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider
  ) {
    this.updateUserRepository = this.repositoryFactory.getRepository(User);
  }

  async updateUser(params: {
    updatedUserData: Partial<User>;
    userId?: string;
    phoneNumber?: string;
    manager?: EntityManager;
  }) {
    const { updatedUserData, userId, phoneNumber, manager } = params;

    logger.info(
      `🔄 Updating user using ${
        userId ? "ID: " + userId : "Phone: " + phoneNumber
      }`
    );

    if (Object.keys(updatedUserData).length === 0) {
      throw new CustomError(NO_DATA_TO_UPDATE);
    }

    if (!userId && !phoneNumber) {
      throw new CustomError("Provide either userId or phoneNumber");
    }

    const em = manager || this.updateUserRepository.manager;

    let userData: User;

    if (userId) {
      userData = await this.userInfoProvider.getUser({ id: userId });
    } else {
      userData = await this.userInfoProvider.getUser({ phoneNumber });
    }

    Object.assign(userData, updatedUserData);

    const updatedUser = await em.save(User, userData);

    logger.info(
      `📝 Fields updated: ${Object.keys(updatedUserData).join(", ")}`
    );

    logger.info(`✅ Successfully updated user`);

    return new SingleUserResponse(true, USER_UPDATED, updatedUser);
  }

  async sendUserUpdateOtp(params: {
    userId: string;
    updatedFields: UpdatedUserInput;
  }): Promise<SendUpdateOtpResponse> {
    const { userId, updatedFields } = params;

    logger.info(`🔄 Request to update user with OTP. User ID: ${userId}`);

    // Validation
    const hasUpdates = Object.values(updatedFields).some(
      (v) => v !== undefined
    );
    if (!hasUpdates) {
      logger.warn(`⚠️ No fields provided to update for user ${userId}`);
      throw new CustomError("No fields provided to update");
    }

    // Fetch user
    const user = await this.userInfoProvider.getUser({ id: userId });
    if (!user) throw new CustomError("User not found");

    // Redis key
    const redisKey = generateRedisOtpKey(userId, "updateUser");

    // Generate OTP
    const userSecret = generateUserSecret();
    const otpDetails = generateOtp(userSecret.base32);

    // Save in Redis
    await redis.setex(
      redisKey,
      300, // 5 minutes
      JSON.stringify({
        otpCode: otpDetails.otpCode,
        updatedFields,
      })
    );

    logger.info(
      `🔐 OTP generated and stored in Redis for user ${userId}. Otp is ${otpDetails.otpCode}`
    );

    // Send SMS
    // await sendOtpSMS(user.phoneNumber, otpDetails.otpCode);

    logger.info(
      `📩 OTP sent to ${user.phoneNumber} for updating user ${userId}`
    );

    return {
      success: true,
      message: OTP_SENT,
    };
  }

  async verifyUserUpdateOtp(params: {
    userId: string;
    otp: string;
  }): Promise<SingleUserResponse> {
    const { userId, otp } = params;

    logger.info(`🔍 Verifying update-user OTP for user ${userId}`);

    const redisKey = generateRedisOtpKey(userId, "updateUser");

    // Read from Redis
    const redisData = await redis.get(redisKey);
    if (!redisData) {
      logger.warn(`❌ OTP expired or not found for user ${userId}`);
      throw new CustomError("OTP expired or not found");
    }

    const { otpCode, updatedFields } = JSON.parse(redisData);

    // Check OTP
    if (otp !== otpCode) {
      logger.warn(`❌ Invalid OTP entered by user ${userId}`);
      throw new CustomError("Invalid OTP");
    }

    logger.info(`🔐 OTP verified. Updating user ${userId}`);

    // Update user with your existing provider logic
    const updatedUser = await this.updateUser({
      userId,
      updatedUserData: updatedFields,
    });

    // Invalidate OTP key
    await redis.del(redisKey);

    logger.info(`🎉 User ${userId} updated after correct OTP`);

    return updatedUser;
  }
}
