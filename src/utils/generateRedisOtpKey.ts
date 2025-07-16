export const generateRedisOtpKey = (userId: string, bookingId: string) => {
  return `otp:startBooking:${userId}:${bookingId}`;
};
