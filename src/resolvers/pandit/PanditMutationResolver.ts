import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";

import { SinglePanditResponse } from "../../types/responses/PanditResponse";
import { PanditAuthProvider } from "../../providers/pandit/PanditAuthProvider";
import { promiseTimeout } from "../../utils/promiseTimeout";
import { Context } from "../../types/context";
import { CustomError } from "../../utils/customError";
import { UNAUTHORIZED } from "../../utils/messages";
import { Role } from "../../utils/enums";

@Service()
@Resolver()
export class PanditMutationResolver {
  constructor(
    @Inject(() => PanditAuthProvider)
    private panditAuthProvider: PanditAuthProvider
  ) {}

  @Mutation(() => SinglePanditResponse)
  @Authorized(Role.USER)
  async registerPandit(
    @Arg("password") password: string,
    @Arg("documents", () => [GraphQLUpload]) documents: Promise<FileUpload>[],
    @Arg("serviceIds", () => [String]) serviceIds: string[],
    @Arg("experience") experience: number,
    @Arg("address") address: string,
    @Ctx() ctx: Context
  ): Promise<SinglePanditResponse> {
    const userId = ctx.user?.id;

    if (!userId) {
      throw new CustomError(UNAUTHORIZED);
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
}
