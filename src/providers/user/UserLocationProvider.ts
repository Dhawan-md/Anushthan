import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { PanditInfoProvider } from "../pandit/PanditInfoProvider";

import { UserLocation } from "../../entities/UserLocation";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { getAddressFromCoordinates } from "../../helpers/getAddressFromCoordinates";

import { LocationResponse } from "../../types/responses/LocationResponse";
import {
  NearByPanditResponse,
  PanditWithDistance,
} from "../../types/responses/PanditResponse";

import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { NO_USER_FOUND } from "../../utils/messages";
import { isLocationSimilar } from "../../utils/isLocationSimilar";
import { UserRole } from "../../utils/enums";

@Service()
export class UserLocationProvider {
  private userLocationRepository: Repository<UserLocation>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider
  ) {
    this.userLocationRepository =
      this.repositoryFactory.getRepository(UserLocation);
  }

  async getLocation(params: {
    latitude: number;
    longitude: number;
    id: string;
    userRole: UserRole;
  }): Promise<LocationResponse> {
    const { latitude, longitude, id, userRole } = params;

    const userId = await this.resolveUserId(id, userRole);

    const existingLocation = await this.findLocationByUserId(userId);

    if (
      existingLocation &&
      isLocationSimilar(
        existingLocation.latitude,
        existingLocation.longitude,
        latitude,
        longitude
      )
    ) {
      // Update existing location
      logger.info(
        `[UserLocationProvider] Location for user ${userId} is similar, no update performed.`
      );
      return new LocationResponse(
        true,
        "Location unchanged (already up to date)",
        existingLocation.address
      );
    }

    const address = await getAddressFromCoordinates(latitude, longitude);
    logger.info(`[UserLocationProvider.ts] Retrieved address: ${address}`);

    const locationEntity = existingLocation
      ? this.userLocationRepository.merge(existingLocation, {
          latitude,
          longitude,
          address,
        })
      : this.userLocationRepository.create({
          latitude,
          longitude,
          address,
          user: { id: userId },
        });

    const savedLocation = await this.userLocationRepository.save(
      locationEntity
    );
    logger.info(
      `[UserLocationProvider] ${
        existingLocation ? "Updated" : "Created"
      } location for user ${userId}`
    );

    return new LocationResponse(
      true,
      "Location found successfully",
      savedLocation.address
    );
  }

  async getLocationDetails(
    id: string,
    userRole: UserRole = UserRole.USER
  ): Promise<UserLocation> {
    logger.info(
      `[UserLocationProvider.ts] 🔍 Searching location details for user: ${id}`
    );
    const userId = await this.resolveUserId(id, userRole);

    const userLocationDetails = await this.findLocationByUserId(userId);

    if (!userLocationDetails) {
      logger.warn(`❌ No location details found for userId: ${userId}`);
      throw new CustomError(NO_USER_FOUND);
    }

    return userLocationDetails;
  }

  async findNearbyPandits(
    userId: string,
    radiusKm = 10
  ): Promise<NearByPanditResponse> {
    const userLocation = await this.getLocationDetails(userId);

    if (!userLocation) throw new CustomError("User location not found");

    const panditArray = await this.panditInfoProvider.findPanditsInRadius(
      userLocation,
      radiusKm
    );

    const result: PanditWithDistance[] = panditArray.map((item) => ({
      id: item.id, // or item.id if id is directly on the object
      distance: item.distance,
    }));

    return new NearByPanditResponse(
      true,
      "Near by pandits found",
      result,
      result.length
    );
  }

  private async resolveUserId(id: string, role: UserRole): Promise<string> {
    if (role === UserRole.PANDIT) {
      const panditDetails = await this.panditInfoProvider.getPandit({
        data: { id },
        withUser: true,
      });
      return panditDetails.user.id;
    }
    return id;
  }

  private async findLocationByUserId(userId: string) {
    logger.info(
      `[UserLocationProvider.ts] 🔍 Searching location details for user: ${userId}`
    );

    return this.userLocationRepository.findOne({
      where: { user: { id: userId } },
    });
  }
}
