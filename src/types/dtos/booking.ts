import { PaginationDto } from "./Pagination";

export class placeBookingDto {
  serviceIds: string[];
  timeSlot: Date;
  location: string;
  totalPrice: number;
  userId: string;
}

export class acceptBookingDto {
  bookingId: string;
  panditId: string;
}

export class MyBookingsDto extends PaginationDto {
  id: string;
}
