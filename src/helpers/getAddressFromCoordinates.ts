import axios from "axios";

import { CustomError } from "../utils/customError";
import { logger } from "../utils/logger";
import { FETCH_LOCATION_ERROR, LOCATION_NOT_FOUND } from "../utils/messages";

export async function getAddressFromCoordinates(
  lat: number,
  lng: number
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_CREDENTIALS;
  if (!apiKey) {
    logger.error("Google API key is missing in environment variables.");
    throw new CustomError(FETCH_LOCATION_ERROR);
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  const res = await axios.get(url);
  const results = res.data.results;

  if (results && results.length > 0) {
    return results[0].formatted_address;
  }

  return LOCATION_NOT_FOUND;
}
