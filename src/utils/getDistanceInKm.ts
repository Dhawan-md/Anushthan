// Utility function
export const getDistanceInKm = (
  userCoordinates: { lat1: number; lon1: number },
  panditCoordinates: { lat2: number; lon2: number }
): number => {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(panditCoordinates.lat2 - userCoordinates.lat1);
  const dLon = toRad(panditCoordinates.lon2 - userCoordinates.lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(userCoordinates.lat1)) *
      Math.cos(toRad(panditCoordinates.lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
