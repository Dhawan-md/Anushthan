// utils/maps.ts
import axios from "axios";

export async function getAddressFromCoordinates(
  lat: number,
  lng: number
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_CREDENTIALS;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  console.log(url);

  const res = await axios.get(url);
  const results = res.data.results;

  if (results && results.length > 0) {
    console.log(results, "[getAdress]");

    return results[0].formatted_address;
  }

  return "Address not found";
}
