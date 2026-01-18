import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { UserInfoProvider } from "../user/UserInfoProvider";
import { PanditInfoProvider } from "./PanditInfoProvider";
import { OtpProvider } from "../otp/OtpProvider";
import { CategoryInfoProvider } from "../category/CategoryInfoProvider";

import { Pandit } from "../../entities/Pandit";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { uploadFiles } from "../../helpers/uploadS3Files";

import { sendEmail } from "../../service/email/sendEmail";

import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import {
  LoginPanditDto,
  RegisterPanditDto,
  SetPanditPasswordDto,
  VerifyPanditDto,
} from "../../types/dtos/Pandit";

import { validatePassword } from "../../utils/validatePassword";
import { CustomError } from "../../utils/customError";
import { isSamePassword } from "../../utils/isSamePassword";

import {
  EmailType,
  OtpType,
  PanditStatus,
  S3BucketType,
  UserRole,
} from "../../utils/enums";
import {
  CATEGORY_NOT_FOUND,
  FILE_UPLOAD_FAIL,
  INVALID_PASSWORD,
  LOGIN_SUCCESSFUL,
  PANDIT_ALREADY_EXISTS,
  PANDIT_LOGIN_REQUESTED,
  PANDIT_NOT_APPROVED,
  PANDIT_REGISTERED,
  PASSWORD_NOT_SET,
} from "../../utils/messages";
import { logger } from "../../utils/logger";
// import { sendOtpSMS } from "../../service/sms/sendOtpSms";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../helpers/generateJwtToken";
import { Category } from "../../entities/Category";
import { hashPassword } from "../../utils/hashPassword";

@Service()
export class PanditAuthProvider {
  private panditAuthRepository: Repository<Pandit>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UserInfoProvider)
    private userInfoProvider: UserInfoProvider,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider,
    @Inject(() => CategoryInfoProvider)
    private categoryInfoProvider: CategoryInfoProvider,
    @Inject(() => OtpProvider)
    private otpProvider: OtpProvider
  ) {
    this.panditAuthRepository = this.repositoryFactory.getRepository(Pandit);
  }

  async registerPandit(
    params: RegisterPanditDto
  ): Promise<SinglePanditResponse> {
    logger.info(
      `🔄Processing register Pandit request for user with userId : ${params.userId}`
    );
    const {
      userId,
      //  password,
      documents,
      categoryIds,
      experience,
      address,
    } = params;

    console.log(params);

    // validatePassword(password);
    const isExisting = await this.panditInfoProvider.checkPanditExists({
      userId,
    });

    if (isExisting) {
      logger.warn(`⚠️ Pandit with userId "${userId}" already exists.`);
      throw new CustomError(PANDIT_ALREADY_EXISTS);
    }

    const user = await this.userInfoProvider.getUser({ id: userId });

    const categories =
      await this.categoryInfoProvider.getCategories(categoryIds);

    if (!categories.data || categories.data.length === 0) {
      throw new CustomError(CATEGORY_NOT_FOUND);
    }

    const validCategories: Category[] = categories.data;

    // const hashedPassword = await hashPassword(password);

    const uploadedDocuments = await uploadFiles(
      documents,
      S3BucketType.PANDIT_DOCUMENTS,
      `pandits/documents/${userId}`
    );

    if (!uploadedDocuments || uploadedDocuments.length === 0) {
      throw new CustomError(FILE_UPLOAD_FAIL);
    }

    const pandit = this.panditAuthRepository.create({
      user,
      categories: validCategories,
      experience,
      // password: hashedPassword,
      documents: uploadedDocuments.map((f) => f.filePath),
      address,
    });

    const newPandit = await this.panditAuthRepository.save(pandit);

    await sendEmail(
      user.userEmail,
      {
        name: user.name,
      },
      EmailType.PANDIT_PENDING
    );

    logger.info(`✅ User ${newPandit.id} registered successfully.`);
    return new SinglePanditResponse(true, PANDIT_REGISTERED, newPandit);
  }

  async loginPandit(params: LoginPanditDto): Promise<SinglePanditResponse> {
    const { phoneNumber, password } = params;
    logger.info(`🔄Logging in pandit with number: ${phoneNumber}.`);

    validatePassword(password);

    const panditData = await this.panditInfoProvider.getPandit({
      data: { phoneNumber },
    });

    if (!panditData.password) {
      if (panditData.status !== PanditStatus.APPROVED) {
        throw new CustomError(PANDIT_NOT_APPROVED);
      }
      throw new CustomError(PASSWORD_NOT_SET);
    }

    const isMatching = await isSamePassword({
      inputPassword: password,
      hashedPassword: panditData.password,
    });

    if (!isMatching) {
      throw new CustomError(INVALID_PASSWORD);
    }

    await this.otpProvider.generateAndSaveNewOtp(phoneNumber, OtpType.PANDIT);

    // await sendOtpSMS(phoneNumber, otp.otpCode);

    logger.info(
      `✅ Pandit with phone number ${phoneNumber} logged in requested.`
    );

    return new SinglePanditResponse(true, PANDIT_LOGIN_REQUESTED);
  }

  async verifyPandit(params: VerifyPanditDto): Promise<SinglePanditResponse> {
    const { phoneNumber, otpCode } = params;
    logger.info(
      `🔄 Verification request received for pandit with phone number: ${phoneNumber}`
    );

    const panditData = await this.panditInfoProvider.getPandit({
      data: { phoneNumber },
    });

    logger.info(`🔍 Verifying OTP for user with phone number: ${phoneNumber}`);
    await this.otpProvider.verifyOtp({
      phoneNumber,
      otpCode,
      otpType: OtpType.PANDIT,
    });

    const accessToken = generateAccessToken({
      id: panditData.id,
      userRole: UserRole.PANDIT,
    });
    const refreshToken = generateRefreshToken({ id: panditData.id });

    logger.info(
      `✅ Pandit with phone number ${phoneNumber} logged in successfully.`
    );
    return new SinglePanditResponse(
      true,
      LOGIN_SUCCESSFUL,
      panditData,
      accessToken,
      refreshToken
    );
  }

  async setPanditPassword(
    params: SetPanditPasswordDto
  ): Promise<SinglePanditResponse> {
    const { panditId, password } = params;

    logger.info(`🔄 Setting password for pandit: ${panditId}`);

    // 1️⃣ Validate password (same rules frontend follows)
    validatePassword(password);

    // 2️⃣ Get pandit
    const pandit = await this.panditAuthRepository.findOne({
      where: { id: panditId },
      relations: ["user"],
    });

    if (!pandit) {
      throw new CustomError("Pandit not found");
    }

    // 3️⃣ Ensure pandit is approved
    if (pandit.status !== PanditStatus.APPROVED) {
      throw new CustomError(PANDIT_NOT_APPROVED);
    }

    // 4️⃣ Prevent resetting password again
    if (pandit.password) {
      throw new CustomError("Password already set");
    }

    // 5️⃣ Hash password
    const hashedPassword = await hashPassword(password);

    // 6️⃣ Save password
    pandit.password = hashedPassword;
    await this.panditAuthRepository.save(pandit);

    logger.info(`✅ Password set successfully for pandit: ${panditId}`);

    return new SinglePanditResponse(true, "Password set successfully", pandit);
  }
}
