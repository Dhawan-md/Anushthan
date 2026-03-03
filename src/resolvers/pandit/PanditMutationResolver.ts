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

@Service()
@Resolver()
export class PanditMutationResolver {
  constructor(
    @Inject(() => PanditAuthService)
    private panditAuthService: PanditAuthService,
    @Inject(() => PanditPasswordService)
    private panditPasswordService: PanditPasswordService,
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
}
