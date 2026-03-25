import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql";
import { FileUpload } from "graphql-upload-minimal";
import { Inject, Service } from "typedi";

import { PanditAuthService } from "../../services/pandit/PanditAuthService";
import { PanditPasswordService } from "../../services/pandit/PanditPasswordService";

import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { VerifyResetResponse } from "../../types/responses/VerifyResetResponse";

import { Context } from "../../types/context";
import { promiseTimeout } from "../../utils/promiseTimeout";
import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";
import { UserRole } from "../../utils/enums";
import { RegisterPanditInput } from "../../types/inputTypes/pandit/RegisterPanditInput";
import { LoginPanditInput } from "../../types/inputTypes/pandit/LoginPanditInput";
import { EmailInput } from "../../types/inputTypes/EmailInput";
import { VerifyInputs } from "../../types/inputTypes/VerifyInputs";
import { ResetPasswordInput } from "../../types/inputTypes/pandit/ResetPasswordInput";
import {
  ForgetPasswordDto,
  LoginPanditDto,
  ResetPasswordDto,
  VerifyPanditDto,
  VerifyResetPasswordDto,
} from "../../types/dtos/Pandit";
import { plainToInstance } from "class-transformer";
import { UpdatePanditService } from "../../services/pandit/UpdatePanditService";
import { CategoryInfoService } from "../../services/category/CategoryInfoService";
import { ChangePasswordInput } from "../../types/inputTypes/pandit/ChangePasswordInput";
import { UpdatePanditInput } from "../../types/inputTypes/pandit/UpdatePanditInput";
import { PanditAddServiceInput } from "../../types/inputTypes/pandit/AddServiceInput";
import { PanditInfoService } from "../../services/pandit/PanditInfoService";
import { S3Service } from "../../infrastructure/aws/S3Service";
import { S3BucketType } from "../../utils/enums";

@Service()
@Resolver()
export class PanditMutationResolver {
  constructor(
    @Inject(() => PanditAuthService)
    private panditAuthService: PanditAuthService,
    @Inject(() => PanditPasswordService)
    private panditPasswordService: PanditPasswordService,
    @Inject(() => UpdatePanditService)
    private updatePanditService: UpdatePanditService,
    @Inject(() => CategoryInfoService)
    private categoryInfoService: CategoryInfoService,
    @Inject(() => PanditInfoService)
    private panditInfoService: PanditInfoService,
    @Inject(() => S3Service)
    private s3Service: S3Service,
  ) { }

  @Mutation(() => SinglePanditResponse)
  @Authorized(UserRole.USER)
  async registerPandit(
    @Arg("data") data: RegisterPanditInput,
    @Ctx() ctx: Context
  ): Promise<SinglePanditResponse> {
    const userId = ctx.user?.id;

    if (!userId) throw new CustomError(UNAUTHORIZED);

    const resolvedDocument: FileUpload[] = [];
    for (const docPromise of data.documents) {
      const doc = await promiseTimeout(docPromise, 15000);
      resolvedDocument.push(doc);
    }

    return this.panditAuthService.registerPandit({
      userId,
      password: data.password,
      documents: resolvedDocument,
      categoryIds: data.categoryIds,
      experience: data.experience,
    });
  }

  @Mutation(() => SinglePanditResponse)
  async loginPandit(@Arg("data") data: LoginPanditInput) {
    const dto: LoginPanditDto = plainToInstance(LoginPanditDto, data);

    return this.panditAuthService.loginPandit(dto);
  }

  @Mutation(() => SinglePanditResponse)
  async verifyPandit(@Arg("data") data: VerifyInputs) {
    const dto: VerifyPanditDto = plainToInstance(VerifyPanditDto, data);

    return this.panditAuthService.verifyPandit(dto);
  }

  @Mutation(() => SinglePanditResponse)
  async forgetPassword(@Arg("data") data: EmailInput) {
    const dto: ForgetPasswordDto = plainToInstance(ForgetPasswordDto, data);

    return this.panditPasswordService.forgetPassword(dto);
  }

  @Mutation(() => VerifyResetResponse)
  async verifyResetPassword(@Arg("data") data: VerifyInputs) {
    const dto: VerifyResetPasswordDto = plainToInstance(
      VerifyResetPasswordDto,
      data
    );

    return this.panditPasswordService.verifyResetPassword(dto);
  }

  @Mutation(() => SinglePanditResponse)
  async resetPassword(@Arg("data") data: ResetPasswordInput) {
    const dto: ResetPasswordDto = plainToInstance(ResetPasswordDto, data);

    return this.panditPasswordService.resetPassword(dto);
  }

  @Mutation(() => SinglePanditResponse)
  @Authorized(UserRole.PANDIT)
  async changePassword(
    @Arg("data") data: ChangePasswordInput,
    @Ctx() ctx: Context
  ): Promise<SinglePanditResponse> {
    const panditId = ctx.user?.panditId || ctx.user?.id;
    if (!panditId) throw new CustomError(UNAUTHORIZED);

    return this.panditPasswordService.changePassword(panditId, data);
  }

  @Mutation(() => SinglePanditResponse)
  @Authorized(UserRole.PANDIT)
  async updateProfile(
    @Arg("data") data: UpdatePanditInput,
    @Ctx() ctx: Context
  ): Promise<SinglePanditResponse> {
    const panditId = ctx.user?.panditId || ctx.user?.id;
    if (!panditId) throw new CustomError(UNAUTHORIZED);

    const updatedData: any = {};
    if (data.experience !== undefined) updatedData.experience = data.experience;
    if (data.isAvailable !== undefined) updatedData.isAvailable = data.isAvailable;

    if (data.categoryIds) {
      const categories = await this.categoryInfoService.getCategories(data.categoryIds);
      updatedData.categories = categories.data;
    }

    if (data.documents && data.documents.length > 0) {
      const resolvedDocument: FileUpload[] = [];
      for (const docPromise of data.documents) {
        const doc = await promiseTimeout(docPromise, 15000);
        resolvedDocument.push(doc);
      }
      
      const uploadedDocs: any = await this.s3Service.uploadFiles(resolvedDocument, S3BucketType.DOCUMENT);
      updatedData.documents = JSON.stringify(
        (Array.isArray(uploadedDocs) ? uploadedDocs : [uploadedDocs]).map((file) => file.filePath)
      );
    }

    return this.updatePanditService.updatePandit(updatedData, panditId);
  }

  @Mutation(() => SinglePanditResponse)
  @Authorized(UserRole.PANDIT)
  async addServiceAPI(
    @Arg("data") data: PanditAddServiceInput,
    @Ctx() ctx: Context
  ): Promise<SinglePanditResponse> {
    const panditId = ctx.user?.panditId || ctx.user?.id;
    if (!panditId) throw new CustomError(UNAUTHORIZED);

    const pandit = await this.panditInfoService.getPandit({ data: { id: panditId }, withCategory: true });
    
    // Check if categories verify and add to existing
    const newCategories = await this.categoryInfoService.getCategories(data.categoryIds);
    if (!newCategories.data) throw new CustomError("Invalid categories");

    const categoryMap = new Map();
    pandit.categories.forEach(c => categoryMap.set(c.id, c));
    newCategories.data.forEach(c => categoryMap.set(c.id, c));

    return this.updatePanditService.updatePandit(
      { categories: Array.from(categoryMap.values()) },
      panditId
    );
  }
}
