import { Arg, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { OtpProvider } from "../../providers/otp/OtpProvider";

import { OtpResponse } from "../../types/responses/Otpresponse";

import { ResendOtpInput } from "../../types/inputTypes/otp/ResendOtpInput";
import { plainToInstance } from "class-transformer";
import { ResendOtpDto } from "../../types/dtos/Otp";

@Service()
@Resolver()
export class OtpMutationResolver {
  constructor(@Inject(() => OtpProvider) private otpProvider: OtpProvider) {}

  @Mutation(() => OtpResponse)
  async resendOtp(
    @Arg("data", () => ResendOtpInput) data: ResendOtpInput
  ): Promise<OtpResponse> {
    const dto = plainToInstance(ResendOtpDto, data);

    return this.otpProvider.resendOtp(dto);
  }
}
