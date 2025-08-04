export const isLocationSimilar = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  threshold = 0.0001 // ~11 meters
): boolean => {
  return Math.abs(lat1 - lat2) < threshold && Math.abs(lon1 - lon2) < threshold;
};
