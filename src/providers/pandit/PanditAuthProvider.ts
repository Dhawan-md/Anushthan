import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { UserInfoProvider } from "../user/UserInfoProvider";
import { PanditInfoProvider } from "./PanditInfoProvider";
import { OtpProvider } from "../otp/OtpProvider";

import { Pandit } from "../../entities/Pandit";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { uploadFiles } from "../../helpers/uploadS3Files";
import { generateJwtToken } from "../../helpers/generateJwtToken";

import { sendEmail } from "../../service/email/sendEmail";

import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import {
  LoginPanditDto,
  RegisterPanditDto,
  VerifyPanditDto,
} from "../../types/dtos/Pandit";

import { validatePassword } from "../../utils/validatePassword";
import { hashPassword } from "../../utils/hashPassword";
import { CustomError } from "../../utils/customError";
import { validateEmail } from "../../utils/validateEmail";
import { isSamePassword } from "../../utils/isSamePassword";

import {
  EmailName,
  EmailType,
  OtpType,
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
  PANDIT_REGISTERED,
} from "../../utils/messages";
import { logger } from "../../utils/logger";
import { CategoryInfoProvider } from "../category/CategoryInfoProvider";

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
    const { userId, password, documents, categoryIds, experience } = params;

    validatePassword(password);
    const isExisting = await this.panditInfoProvider.checkPanditExists({
      userId,
    });

    if (isExisting) {
      logger.warn(`⚠️ Pandit with userId "${userId}" already exists.`);
      throw new CustomError(PANDIT_ALREADY_EXISTS);
    }

    const user = await this.userInfoProvider.getUser({ id: userId });

    const categories = await this.categoryInfoProvider.getCategories(
      categoryIds
    );

    const hashedPassword = await hashPassword(password);

    let uploadedDocuments: { filePath: string }[] | { filePath: string } =
      await uploadFiles(documents, S3BucketType.DOCUMENT);

    if (!uploadedDocuments) {
      throw new CustomError(FILE_UPLOAD_FAIL);
    }

    if (!categories.data || categories.data.length === 0) {
      throw new CustomError(CATEGORY_NOT_FOUND);
    }

    const newPandit = await this.panditAuthRepository.save({
      user,
      categories: categories.data,
      experience: experience,
      password: hashedPassword,
      documents: JSON.stringify(uploadedDocuments.map((file) => file.filePath)),
    });

    await this.panditAuthRepository
      .createQueryBuilder()
      .relation(Pandit, "categories")
      .of(newPandit)
      .add(categories.data.map((cat) => cat.id));

    const fullPandit = await this.panditAuthRepository.findOne({
      where: { id: newPandit.id },
      relations: ["categories"],
    });
    console.log("Saved categories:", fullPandit?.categories);

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
    const { userEmail, password } = params;
    logger.info(`🔄Logging in pandit with email: ${userEmail}.`);

    validateEmail(userEmail);
    validatePassword(password);

    const panditData = await this.panditInfoProvider.getPandit({
      data: { userEmail },
    });

    const isMatching = await isSamePassword({
      inputPassword: password,
      hashedPassword: panditData.password,
    });

    if (!isMatching) {
      throw new CustomError(INVALID_PASSWORD);
    }

    const otp = await this.otpProvider.generateAndSaveNewOtp(
      userEmail,
      OtpType.PANDIT
    );

    await sendEmail(
      userEmail,
      { name: EmailName.PANDIT, otpCode: otp.otpCode },
      EmailType.PANDIT_LOGIN
    );

    logger.info(`✅ Pandit with email ${userEmail} logged in requested.`);

    return new SinglePanditResponse(true, PANDIT_LOGIN_REQUESTED);
  }

  async verifyPandit(params: VerifyPanditDto): Promise<SinglePanditResponse> {
    const { userEmail, otpCode } = params;
    logger.info(
      `🔄 Verification request received for pandit with email: ${userEmail}`
    );

    const panditData = await this.panditInfoProvider.getPandit({
      data: { userEmail },
    });

    logger.info(`🔍 Verifying OTP for user with email: ${userEmail}`);
    await this.otpProvider.verifyOtp({
      userEmail,
      otpCode,
      otpType: OtpType.PANDIT,
    });

    const jwtToken = generateJwtToken({
      id: panditData.id,
      userRole: UserRole.PANDIT,
    });

    logger.info(`✅ Pandit with ${userEmail} logged in successfully.`);
    return new SinglePanditResponse(
      true,
      LOGIN_SUCCESSFUL,
      panditData,
      jwtToken
    );
  }
}
