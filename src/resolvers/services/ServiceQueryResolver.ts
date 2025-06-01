import { Arg, Authorized, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";
import { plainToInstance } from "class-transformer";

import { ServiceInfoProvider } from "../../providers/service/ServiceInfoProvider";

import { MultipleServiceResponse } from "../../types/responses/ServiceResponse";

import { GetServiceInput } from "../../types/inputTypes/service/GetServiceInput";
import { GetServiceDto } from "../../types/dtos/service";

@Service()
@Resolver()
export class ServiceQueryResolver {
  constructor(
    @Inject(() => ServiceInfoProvider)
    private serviceInfoProvider: ServiceInfoProvider
  ) {}

  @Query(() => MultipleServiceResponse)
  @Authorized()
  async getServices(
    @Arg("data", () => GetServiceInput, { nullable: true })
    data?: GetServiceInput
  ): Promise<MultipleServiceResponse> {
    const dto = plainToInstance(GetServiceDto, data || {});
    return this.serviceInfoProvider.getAllServices(dto);
  }
}
