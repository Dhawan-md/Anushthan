import { Service } from "typedi";
import axios from "axios";
import { env } from "../../config/env";
import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { FETCH_LOCATION_ERROR, LOCATION_NOT_FOUND } from "../../utils/messages";
import { LocationSuggestion } from "../../types/interfaces";

@Service()
export class GoogleMapsService {
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = env.GOOGLE_API_CREDENTIALS;
        if (!this.apiKey) {
            logger.warn("[GoogleMapsService] ⚠️ Google API credentials missing. Location features may fail.");
        }
    }

    async getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
        if (!this.apiKey) {
            throw new CustomError(FETCH_LOCATION_ERROR);
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;

        try {
            const res = await axios.get(url);
            const results = res.data.results;

            if (results && results.length > 0) {
                return results[0].formatted_address;
            }

            return LOCATION_NOT_FOUND;
        } catch (error: any) {
            logger.error(`❌ Failed to fetch address from coordinates (${lat}, ${lng}): ${error.message}`);
            throw new CustomError(FETCH_LOCATION_ERROR);
        }
    }

    async getLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
        if (!this.apiKey) {
            throw new CustomError("⚠️ Google API key not set.");
        }

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            query
        )}&key=${this.apiKey}`;

        try {
            const res = await axios.get(url);
            const predictions = res.data.predictions;

            return predictions.map((p: any) => ({
                description: p.description,
                placeId: p.place_id,
            }));
        } catch (error: any) {
            logger.error(`❌ Failed to fetch location suggestions for "${query}": ${error.message}`);
            throw new CustomError("Failed to fetch location suggestions.");
        }
    }
}
