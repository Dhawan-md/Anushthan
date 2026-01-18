import { Inject, Service } from "typedi";
import { Repository } from "typeorm";

import { PanditInfoProvider } from "../pandit/PanditInfoProvider";

import { UserLocation } from "../../entities/UserLocation";

import { RepositoryFactory } from "../../factories/RepositoryFactory";

import { getAddressFromCoordinates } from "../../helpers/getAddressFromCoordinates";

import {
  LocationCordinateResponse,
  LocationResponse,
} from "../../types/responses/LocationResponse";
import {
  NearByPanditResponse,
  PanditWithDistance,
} from "../../types/responses/PanditResponse";

import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { LOCATION_NOT_FOUND } from "../../utils/messages";
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
  }): Promise<LocationCordinateResponse> {
    const { latitude, longitude, id, userRole } = params;

    const userId = await this.resolveUserId(id, userRole);

    const address = await getAddressFromCoordinates(latitude, longitude);
    logger.info(`[UserLocationProvider.ts] Retrieved address: ${address}`);

    logger.info(`[UserLocationProvider] fetched location for user ${userId}`);

    return new LocationCordinateResponse(
      true,
      "Location found successfully",
      address
    );
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
      throw new CustomError(LOCATION_NOT_FOUND);
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

    const user = await this.userInfoProvider.getUser({
      id: userId,
      relations: ["selectedAddress"], // needed to update relation
    });

    if (!user) throw new CustomError("User not found");
    // Fetch user
    const existingLabel = await this.userLocationRepository.findOne({
      where: {
        user: { id: userId },
        label,
      },
    });

    if (existingLabel) {
      return new LocationResponse(
        false,
        `Address with label "${label}" already exists.`,
        existingLabel
      );
    }

    const existingAddress = await this.userLocationRepository
      .createQueryBuilder("location")
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
      });

      return new LocationResponse(
        false,
        "Duplicate avoided. Existing address selected",
        existingAddress
      );
    }

    // Create new address

    const newAddress = await this.userLocationRepository.save({
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
    });

    return new LocationResponse(
      true,
      "Address added & selected successfully",
      newAddress
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

  async setSelectedAddress(params: {
    userId: string;
    userRole: UserRole;
    addressId: string;
  }): Promise<LocationResponse> {
    const { userId, userRole, addressId } = params;

    logger.info(
      `[UserLocationProvider] 🔄 Request to change selected address for userId=${userId}, role=${userRole}, addressId=${addressId}`
    );

    // 1️⃣ Resolve correct user ID (works for both USER & PANDIT)
    const resolvedUserId = await this.resolveUserId(userId, userRole);
    logger.info(
      `[UserLocationProvider.ts] 👤 Resolved userId=${resolvedUserId} for role=${userRole}`
    );

    // 2️⃣ Get user with selectedAddress relation
    const user = await this.userInfoProvider.getUser({
      id: resolvedUserId,
      relations: ["selectedAddress"],
    });

    if (!user) {
      logger.error(
        `[UserLocationProvider.ts] ❌ User not found for resolvedUserId=${resolvedUserId}`
      );
      throw new CustomError("User not found");
    }

    logger.info(
      `[UserLocationProvider.ts] 👀 User exists. Current selectedAddressId=${
        user.selectedAddress?.id ?? "none"
      }`
    );

    // 3️⃣ Check if address exists
    const address = await this.userLocationRepository.findOne({
      where: { id: addressId, user: { id: resolvedUserId } },
    });

    if (!address) {
      logger.warn(
        `[UserLocationProvider.ts] ⚠️ Address not found or doesn't belong to user. addressId=${addressId}, userId=${resolvedUserId}`
      );
      throw new CustomError("Address not found for this user");
    }

    logger.info(
      `[UserLocationProvider.ts] 📍 Address found. Updating selectedAddress to id=${addressId}`
    );

    // 4️⃣ Update user.selectedAddress
    user.selectedAddress = address;

    await this.updateUserProvider.updateUser({
      userId: resolvedUserId,
      updatedUserData: { selectedAddress: address },
    });

    logger.info(
      `[UserLocationProvider.ts] ✅ Selected address successfully updated for userId=${resolvedUserId} → newAddressId=${addressId}`
    );

    return new LocationResponse(
      true,
      "Selected address updated successfully",
      address
    );
  }

  async updateAddress(params: {
    addressId: string;
    userId: string;
    userRole: UserRole;
    updatedLocationData: Partial<UserLocation>;
  }) {
    const { addressId, userId, userRole, updatedLocationData } = params;

    logger.info(
      `[UserLocationProvider] 🛠 Updating address ${addressId} for user ${userId}`
    );

    if (Object.keys(updatedLocationData).length === 0) {
      logger.warn(
        `[UserLocationProvider] ⚠️ No fields provided to update for address ${addressId}`
      );
      throw new CustomError("No data provided to update address");
    }

    const resolvedUserId = await this.resolveUserId(userId, userRole);

    // 🔍 Get existing address
    const location = await this.userLocationRepository.findOne({
      where: { id: addressId, user: { id: resolvedUserId }, isDeleted: false },
    });

    if (!location) {
      logger.error(
        `[UserLocationProvider] ❌ Address not found or deleted: ${addressId}`
      );
      throw new CustomError("Address not found");
    }

    // 👈 Merge updates
    Object.assign(location, updatedLocationData);

    // 💾 Save updates
    const updatedLocation = await this.userLocationRepository.save(location);

    logger.info(
      `[UserLocationProvider] ✨ Updated fields for address ${addressId}: ${Object.keys(
        updatedLocationData
      ).join(", ")}`
    );

    return updatedLocation;
  }

  async deleteAddress(data: {
    userId: string;
    userRole: UserRole;
    addressId: string;
  }): Promise<LocationResponse> {
    const { userId, userRole, addressId } = data;

    const resolvedUserId = await this.resolveUserId(userId, userRole);

    const address = await this.userLocationRepository.findOne({
      where: { id: addressId, user: { id: resolvedUserId }, isDeleted: false },
    });

    if (!address) {
      throw new CustomError("Address not found or already deleted");
    }

    // Prevent deleting selected address
    const user = await this.userInfoProvider.getUser({
      id: resolvedUserId,
      relations: ["selectedAddress"],
    });

    if (user.selectedAddress?.id === addressId) {
      throw new CustomError("You cannot delete your selected address");
    }

    // mark deleted
    const deletedAddress = await this.updateAddress({
      addressId,
      userId,
      userRole,
      updatedLocationData: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return new LocationResponse(
      true,
      "Address deleted successfully",
      deletedAddress
    );
  }
}
