import { Arg, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { OtpProvider } from "../../providers/otp/OtpProvider";
import { OtpResponse } from "../../types/responses/Otpresponse";

@Service()
@Resolver()
export class OtpMutationResolver {
  constructor(@Inject(() => OtpProvider) private otpProvider: OtpProvider) {}

  @Mutation(() => OtpResponse)
  async resendOtp(@Arg("userEmail") userEmail: string) {
    return await this.otpProvider.resendOtp(userEmail);
  }
}
