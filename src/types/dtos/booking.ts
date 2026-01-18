import { PaginationDto } from "./Pagination";
import {
  ActiveStatus,
  PaymentType,
  UserCancellationReason,
  UserRole,
} from "../../utils/enums";

export class PlaceBookingDto {
  userId: string;
  serviceIds: string[];
  categoryId: string;
  location: string;
  timeSlotId: string;
  bookingDate: Date;
  subTotalPrice: number;
  gstTax: number;
  platformFee: number;
  discount: number;
  estimatedTime: number;
  paid: boolean;
  transactionId?: string;
  paymentType: PaymentType;
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

export class CreateCancellationDto {
  userId: string;
  panditId?: string;
  bookingId: string;
  amount: number;
  cancelledBy: UserRole;
  isPenaltyApplied;
  cancelReason: UserCancellationReason;
  customReason?: string;
  cancelledAt: Date;
  status: ActiveStatus;
}
