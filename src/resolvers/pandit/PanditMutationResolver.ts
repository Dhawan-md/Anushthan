import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { Inject, Service } from "typedi";

import { PanditAuthProvider } from "../../providers/pandit/PanditAuthProvider";
import { PanditPasswordProvider } from "../../providers/pandit/PanditPasswordProvider";

import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { VerifyResetResponse } from "../../types/responses/VerifyResetResponse";

import { Context } from "../../types/context";
import { promiseTimeout } from "../../utils/promiseTimeout";
import { CustomError } from "../../utils/customError";
import { PANDIT_ALREADY_EXISTS, UNAUTHORIZED } from "../../utils/messages";
import { AdminRole, UserRole } from "../../utils/enums";

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
  @Authorized(AdminRole.USER)
  async registerPandit(
    @Arg("password") password: string,
    @Arg("documents", () => [GraphQLUpload]) documents: Promise<FileUpload>[],
    @Arg("serviceIds", () => [String]) serviceIds: string[],
    @Arg("experience") experience: number,
    @Arg("address") address: string,
    @Ctx() ctx: Context
  ): Promise<SinglePanditResponse> {
    const userId = ctx.user?.id;
    const userRole = ctx.user?.userRole;

    if (!userId) {
      throw new CustomError(UNAUTHORIZED);
    }

    if (userRole === UserRole.PANDIT) {
      throw new CustomError(PANDIT_ALREADY_EXISTS);
    }

    const resolvedDocument: FileUpload[] = [];

    for (const docPromise of documents) {
      const doc = await promiseTimeout(docPromise, 15000); // Wait one-by-one
      resolvedDocument.push(doc);
    }

    return this.panditAuthProvider.registerPandit({
      userId,
      password,
      documents: resolvedDocument,
      serviceIds,
      experience,
      address,
    });
  }

  @Mutation(() => SinglePanditResponse)
  async loginPandit(
    @Arg("userEmail") userEmail: string,
    @Arg("password") password: string
  ): Promise<SinglePanditResponse> {
    return this.panditAuthProvider.loginPandit({ userEmail, password });
  }

  @Mutation(() => SinglePanditResponse)
  async verifyPandit(
    @Arg("userEmail") userEmail: string,
    @Arg("otpCode") otpCode: string
  ): Promise<SinglePanditResponse> {
    return this.panditAuthProvider.verifyPandit({ userEmail, otpCode });
  }

  @Mutation(() => SinglePanditResponse)
  async forgetPassword(
    @Arg("userEmail") userEmail: string
  ): Promise<SinglePanditResponse> {
    return this.panditPaswordProvider.forgetPassword(userEmail);
  }

  @Mutation(() => SinglePanditResponse)
  async verifyResetPassword(
    @Arg("userEmail") userEmail: string,
    @Arg("otpCode") otpCode: string
  ): Promise<VerifyResetResponse> {
    return this.panditPaswordProvider.verifyResetPassword({
      userEmail,
      otpCode,
    });
  }

  @Mutation(() => SinglePanditResponse)
  async resetPassword(
    @Arg("newPassword") newPassword: string,
    @Arg("otpToken") otpToken: string
  ): Promise<SinglePanditResponse> {
    return this.panditPaswordProvider.resetPassword({
      newPassword,
      otpToken,
    });
  }
}
