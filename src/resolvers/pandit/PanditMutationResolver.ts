import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql";
import { FileUpload } from "graphql-upload-minimal";
import { Inject, Service } from "typedi";

import { PanditAuthProvider } from "../../providers/pandit/PanditAuthProvider";
import { PanditPasswordProvider } from "../../providers/pandit/PanditPasswordProvider";

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
    @Inject(() => PanditAuthProvider)
    private panditAuthProvider: PanditAuthProvider,
    @Inject(() => PanditPasswordProvider)
    private panditPaswordProvider: PanditPasswordProvider
  ) {}

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

    return this.panditAuthProvider.registerPandit({
      userId,
      password: data.password,
      documents: resolvedDocument,
      serviceIds: data.serviceIds,
      experience: data.experience,
      address: data.address,
    });
  }

  @Mutation(() => SinglePanditResponse)
  async loginPandit(@Arg("data") data: LoginPanditInput) {
    const dto: LoginPanditDto = plainToInstance(LoginPanditDto, data);

    return this.panditAuthProvider.loginPandit(dto);
  }

  @Mutation(() => SinglePanditResponse)
  async verifyPandit(@Arg("data") data: VerifyInputs) {
    const dto: VerifyPanditDto = plainToInstance(VerifyPanditDto, data);

    return this.panditAuthProvider.verifyPandit(dto);
  }

  @Mutation(() => SinglePanditResponse)
  async forgetPassword(@Arg("data") data: EmailInput) {
    const dto: ForgetPasswordDto = plainToInstance(ForgetPasswordDto, data);

    return this.panditPaswordProvider.forgetPassword(dto);
  }

  @Mutation(() => VerifyResetResponse)
  async verifyResetPassword(@Arg("data") data: VerifyInputs) {
    const dto: VerifyResetPasswordDto = plainToInstance(
      VerifyResetPasswordDto,
      data
    );

    return this.panditPaswordProvider.verifyResetPassword(dto);
  }

  @Mutation(() => SinglePanditResponse)
  async resetPassword(@Arg("data") data: ResetPasswordInput) {
    const dto: ResetPasswordDto = plainToInstance(ResetPasswordDto, data);

    return this.panditPaswordProvider.resetPassword(dto);
  }
}
