import { Arg, Authorized, Query, Resolver } from "type-graphql";
import { Inject, Service } from "typedi";
import { plainToInstance } from "class-transformer";

import { ServiceInfoProvider } from "../../providers/service/ServiceInfoProvider";

import { MultipleServiceResponse } from "../../types/responses/ServiceResponse";
import { GetServicesInput } from "../../types/inputTypes/service/GetServiceInput";
import { GetServicesDto } from "../../types/dtos/service";
import { UserRole } from "../../utils/enums";

@Service()
@Resolver()
export class ServiceQueryResolver {
  constructor(
    @Inject(() => ServiceInfoProvider)
    private serviceInfoProvider: ServiceInfoProvider
  ) {}

  @Authorized(UserRole.USER)
  @Query(() => MultipleServiceResponse)
  async getAllServices(
    @Arg("data", () => GetServicesInput, { nullable: true })
    data?: GetServicesInput
  ): Promise<MultipleServiceResponse> {
    const dto = plainToInstance(GetServicesDto, data || {});

    return this.serviceInfoProvider.getAllServices(dto);
  }
}
