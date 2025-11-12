export function getHoursDiffFromStartTime(
  bookingDate: Date,
  startTime: string,
  now: Date = new Date()
): number {
  const [hours, minutes, seconds] = startTime.split(":").map(Number);

  const startDateTime = new Date(bookingDate);
  startDateTime.setHours(hours, minutes, seconds || 0, 0);

  return (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
}
