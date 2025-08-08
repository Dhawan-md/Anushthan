import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import { UserLocation } from "../../entities/UserLocation";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { logger } from "../../utils/logger";
import { LocationResponse } from "../../types/responses/LocationResponse";
import { getAddressFromCoordinates } from "../../helpers/getAddressFromCoordinates";
import { CustomError } from "../../utils/customError";
import { NO_USER_FOUND } from "../../utils/messages";
import { UpdateUserProvider } from "./UpdateUserProvider";
import { isLocationSimilar } from "../../utils/isLocationSimilar";
import { UserRole } from "../../utils/enums";
import { PanditInfoProvider } from "../pandit/PanditInfoProvider";
import {
  NearByPanditResponse,
  PanditWithDistance,
} from "../../types/responses/PanditResponse";

@Service()
export class UserLocationProvider {
  private userLocationRepository: Repository<UserLocation>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UpdateUserProvider)
    private updateUserProvider: UpdateUserProvider,
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
    const address = await getAddressFromCoordinates(latitude, longitude);
    logger.info(`[UserInfoProvider.ts] Retrieved address: ${address}`);

    let userId = id;

    if (userRole === UserRole.PANDIT) {
      const panditDetails = await this.panditInfoProvider.getPandit({
        data: { id },
        withUser: true,
      });
      userId = panditDetails.user.id;
    }

    const existingLocation = await this.userLocationRepository.findOne({
      where: { userId },
    });

    let savedLocation: UserLocation;

    if (existingLocation) {
      // Update existing location
      const isSimilar = isLocationSimilar(
        existingLocation.latitude,
        existingLocation.longitude,
        latitude,
        longitude
      );

      if (isSimilar) {
        logger.info(
          `[UserInfoProvider] Location for user ${userId} is similar, no update performed.`
        );
        return new LocationResponse(
          true,
          "Location unchanged (already up to date)",
          existingLocation.address
        );
      }

      existingLocation.latitude = latitude;
      existingLocation.longitude = longitude;
      existingLocation.address = address;

      savedLocation = await this.userLocationRepository.save(existingLocation);
      logger.info(`[UserInfoProvider] Updated location for user ${userId}`);
    } else {
      savedLocation = await this.userLocationRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const newLocation = transactionalEntityManager.create(UserLocation, {
            userId,
            latitude,
            longitude,
            address,
          });

          await this.updateUserProvider.updateUser({
            updatedUserData: { userLocation: newLocation },
            userId,
            manager: transactionalEntityManager,
          });
          savedLocation = await transactionalEntityManager.save(newLocation);

          logger.info(
            `[UserInfoProvider] Created new location for user ${userId}`
          );

          return savedLocation;
        }
      );
    }
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
    let userId = id;

    if (userRole === UserRole.PANDIT) {
      const panditDetails = await this.panditInfoProvider.getPandit({
        data: { id },
        withUser: true,
      });
      userId = panditDetails.user.id;
    }

    const userLocationDetails = await this.userLocationRepository.findOne({
      where: { userId },
    });

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
    // Fetch user's location first
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

    return new NearByPanditResponse(true, "near by pandits found", result);
  }
}
