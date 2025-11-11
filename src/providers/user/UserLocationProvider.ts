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
import { UserRole } from "../../utils/enums";
import { NearByPanditFiltersDto } from "../../types/dtos/Pandit";
import { UserInfoProvider } from "./UserInfoProvider";
import { UpdateUserProvider } from "./UpdateUserProvider";
import { getLocationSuggestions } from "../../helpers/locationSuggestions";
import { LocationSuggestion } from "../../types/interfaces";
import { MultipleUserLocationResponse } from "../../types/responses/UserLocationResponse";

@Service()
export class UserLocationProvider {
  private userLocationRepository: Repository<UserLocation>;

  constructor(
    private repositoryFactory: RepositoryFactory,
    @Inject(() => PanditInfoProvider)
    private panditInfoProvider: PanditInfoProvider,
    @Inject(() => UserInfoProvider) private userInfoProvider: UserInfoProvider,
    @Inject(() => UpdateUserProvider)
    private updateUserProvider: UpdateUserProvider
  ) {
    this.userLocationRepository =
      this.repositoryFactory.getRepository(UserLocation);
  }

  async getLocationByCoordinates(params: {
    latitude: number;
    longitude: number;
    id: string;
    userRole: UserRole;
  }): Promise<LocationResponse> {
    const { latitude, longitude, id, userRole } = params;

    const userId = await this.resolveUserId(id, userRole);

    const address = await getAddressFromCoordinates(latitude, longitude);
    logger.info(`[UserLocationProvider.ts] Retrieved address: ${address}`);

    logger.info(`[UserLocationProvider] fetched location for user ${userId}`);

    return new LocationResponse(true, "Location found successfully", address);
  }

  async getResolvedLocationDetails(
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
    params: NearByPanditFiltersDto
  ): Promise<NearByPanditResponse> {
    const {
      userId,
      radiusKm = 10,
      timeSlotId,
      bookingDate,
      categoryId,
    } = params;
    
    const userLocation = await this.getResolvedLocationDetails(userId);

    if (!userLocation) throw new CustomError("User location not found");

    const panditArray = await this.panditInfoProvider.findPanditsInRadius({
      userLocation,
      radiusKm,
      filters: {
        timeSlotId,
        bookingDate,
      },
      categoryId,
    });

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

  async addAddress(params: {
    latitude: number;
    longitude: number;
    id: string;
    userRole: UserRole;
    label: string;
    addressDetails?: string;
    phoneNumber: string;
  }): Promise<LocationResponse> {
    const {
      latitude,
      longitude,
      id,
      userRole,
      label,
      addressDetails,
      phoneNumber,
    } = params;

    const userId = await this.resolveUserId(id, userRole);

    return this.userLocationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const user = await this.userInfoProvider.getUser({
          id: userId,
          relations: ["selectedAddress"], // needed to update relation
        });

        if (!user) throw new CustomError("User not found");
        // Fetch user
        const existingLabel = await transactionalEntityManager.findOne(
          UserLocation,
          {
            where: {
              user: { id: userId },
              label,
            },
          }
        );

        if (existingLabel) {
          return new LocationResponse(
            false,
            `Address with label "${label}" already exists.`,
            existingLabel.addressDetails
          );
        }

        const existingAddress = await transactionalEntityManager
          .createQueryBuilder(UserLocation, "location")
          .innerJoin("location.user", "user")
          .where("user.id = :userId", { userId })
          .andWhere("location.latitude = :lat", { lat: latitude })
          .andWhere("location.longitude = :lng", { lng: longitude })
          .getOne();

        console.log(existingAddress);

        if (existingAddress) {
          // Option 1: Return existing one instead of creating
          user.selectedAddress = existingAddress;
          await this.updateUserProvider.updateUser({
            userId,
            updatedUserData: { selectedAddress: existingAddress },
            manager: transactionalEntityManager,
          });

          return new LocationResponse(
            false,
            "Duplicate avoided. Existing address selected",
            existingAddress.addressDetails
          );
        }

        // Create new address

        const newAddress = await transactionalEntityManager.save(UserLocation, {
          user: { id: userId }, // proper entity reference
          latitude,
          longitude,
          label,
          addressDetails,
          phoneNumber,
        });

        // ✅ Update user's selectedAddress to this new one
        user.selectedAddress = newAddress;
        await this.updateUserProvider.updateUser({
          userId: id,
          updatedUserData: { selectedAddress: newAddress },
          manager: transactionalEntityManager,
        });

        return new LocationResponse(
          true,
          "Address added & selected successfully",
          newAddress.addressDetails
        );
      }
    );
  }

  async getAllAddressesForUser(
    userId: string,
    userRole: UserRole = UserRole.USER
  ): Promise<MultipleUserLocationResponse> {
    // Resolve userId if the role is PANDIT
    const resolvedUserId = await this.resolveUserId(userId, userRole);

    // Fetch all addresses for this user
    const addresses = await this.userLocationRepository.find({
      where: { user: { id: resolvedUserId } },
      order: { label: "ASC" }, // optional: order by label
    });

    if (addresses.length === 0) {
      logger.warn(
        `[UserLocationProvider.ts] ❌ No addresses found for userId: ${resolvedUserId}`
      );
      throw new CustomError("No addresses found for the user");
    }

    return new MultipleUserLocationResponse(
      true,
      "Addresses fetched",
      addresses,
      addresses.length
    );
  }

  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    const suggestions = await getLocationSuggestions(query);

    return suggestions;
  }
}
