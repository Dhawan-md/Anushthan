import fetch from "node-fetch";

import { LocationSuggestion } from "../types/interfaces";
import { CustomError } from "../utils/customError";

export async function getLocationSuggestions(
  query: string
): Promise<LocationSuggestion[]> {
  const apiKey = process.env["GOOGLE_API_CREDENTIALS"] as string;

  if (!apiKey) {
    throw new CustomError("⚠️ GOOGLE_API_KEY not set in .env");
  }

  if (!query) return [];

  console.log(query);

  // Step 1: Fetch autocomplete predictions
  const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    query
  )}&components=country:in&key=${apiKey}`;

  const autocompleteResponse = await fetch(autocompleteUrl);
  const autocompleteData = await autocompleteResponse.json();
  console.log(autocompleteData);

  if (!autocompleteData.predictions) return [];

  // Step 2: Fetch coordinates for each prediction using Place Details API
  const suggestions: LocationSuggestion[] = [];

  for (const prediction of autocompleteData.predictions.slice(0, 10)) {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${apiKey}`;

    try {
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      const location = detailsData?.result?.geometry?.location;
      if (location) {
        suggestions.push({
          description: prediction.description,
          latitude: location.lat,
          longitude: location.lng,
        });
      }
    } catch (err) {
      console.error(`Failed to fetch details for ${prediction.place_id}`, err);
    }
  }

  return suggestions;
}
