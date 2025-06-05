import { PaginationDto } from "./Pagination";
import { PaymentMethod } from "../../utils/enums";

export class PlaceBookingDto {
  userId: string;
  serviceIds: string[];
  location: string;
  timeSlot: Date;
  totalPrice: number;
  estimatedTime: number;
  paid: boolean;
  paymentMethod: PaymentMethod;
  transactionId?: string;
}

export class BookingActionDto {
  bookingId: string;
}

export class AcceptBookingDto extends BookingActionDto {
  panditId: string;
}

export class CancelPanditBookingDto extends BookingActionDto {
  panditId: string;
}

export class CancelUserBookingDto extends BookingActionDto {
  userId: string;
  confirmFee?: boolean
}

export class MyBookingsDto extends PaginationDto {
  id: string;
}

export class CreateCancellationFeeDto {
  userId: string;
  bookingId: string;
  amount: number;
}
