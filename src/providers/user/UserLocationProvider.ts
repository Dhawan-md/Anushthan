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

@Service()
export class UserLocationProvider {
  private userLocationRepository: Repository<UserLocation>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => UpdateUserProvider)
    private updateUserProvider: UpdateUserProvider
  ) {
    this.userLocationRepository =
      this.repositoryFactory.getRepository(UserLocation);
  }

  async getLocation(params: {
    latitude: number;
    longitude: number;
    userId: string;
  }): Promise<LocationResponse> {
    const { latitude, longitude, userId } = params;
    const address = await getAddressFromCoordinates(latitude, longitude);
    logger.info(`[UserInfoProvider.ts] Retrieved address: ${address}`);

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

  async getLocationDetails(userId: string): Promise<UserLocation> {
    logger.info(`🔍 Searching location details for user: ${userId}`);

    const userLocationDetails = await this.userLocationRepository.findOne({
      where: { userId },
    });

    if (!userLocationDetails) {
      logger.warn(`❌ No location details found for userId: ${userId}`);
      throw new CustomError(NO_USER_FOUND);
    }

    return userLocationDetails;
  }
}
