import { PaginationDto } from "./Pagination";
import {
  PaymentMethod,
  UserCancellationReason,
  UserRole,
} from "../../utils/enums";

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
  confirmFee?: boolean;
  cancelReason: UserCancellationReason;
  customReason?: string;
}

export class CancelUserBookingDto extends BookingActionDto {
  userId: string;
  confirmFee?: boolean;
  cancelReason: UserCancellationReason;
  customReason?: string;
}

export class MyBookingsDto extends PaginationDto {
  id: string;
}

export class CreateCancellationFeeDto {
  userId: string;
  panditId?: string;
  bookingId: string;
  penaltyAmount: number;
  refundAmount: number;
  cancelledBy: UserRole;
  isPenaltyApplied;
  cancelReason: UserCancellationReason;
  customReason?: string;
  cancelledAt: Date;
}
