import { PaginationDto } from "./Admin";

export class placeBookingDto {
  serviceIds: string[];
  scheduledTime: Date;
  location: string;
  totalPrice: number;
  userId: string;
}

export class acceptBookingDto {
  bookingId: string;
  panditId: string;
}

export class MyBookingsDto extends PaginationDto {
  id: string
}
