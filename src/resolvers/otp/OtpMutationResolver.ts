import { Arg, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { OtpProvider } from "../../providers/otp/OtpProvider";
import { OtpResponse } from "../../types/responses/OtpResponse";
import { OtpType } from "../../utils/enums";

@Service()
@Resolver()
export class OtpMutationResolver {
  constructor(@Inject(() => OtpProvider) private otpProvider: OtpProvider) {}

  @Mutation(() => OtpResponse)
  async resendOtp(
    @Arg("userEmail") userEmail: string,
    @Arg("otpType") otpType: OtpType
  ) {
    return this.otpProvider.resendOtp(userEmail, otpType);
  }
}
