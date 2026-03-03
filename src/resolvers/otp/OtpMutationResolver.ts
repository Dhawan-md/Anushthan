import { Arg, Mutation, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";

import { OtpService } from "../../services/otp/OtpService";

import { OtpResponse } from "../../types/responses/OtpResponse";

import { ResendOtpInput } from "../../types/inputTypes/otp/ResendOtpInput";
import { plainToInstance } from "class-transformer";
import { ResendOtpDto } from "../../types/dtos/Otp";

@Service()
@Resolver()
export class OtpMutationResolver {
  constructor(@Inject(() => OtpService) private otpService: OtpService) {}

  @Mutation(() => OtpResponse)
  async resendOtp(
    @Arg("data", () => ResendOtpInput) data: ResendOtpInput
  ): Promise<OtpResponse> {
    const dto = plainToInstance(ResendOtpDto, data);

    return this.otpService.resendOtp(dto);
  }
}
