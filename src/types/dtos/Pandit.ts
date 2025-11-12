import { FileUpload } from "graphql-upload-minimal";

export class RegisterPanditDto {
  userId: string;
  password: string;
  documents: FileUpload[];
  categoryIds: string[];
  experience: number;
}

export class LoginPanditDto {
  phoneNumber: string;
  password: string;
}

export class VerifyPanditDto {
  phoneNumber: string;
  otpCode: string;
}

export class ForgetPasswordDto {
  phoneNumber: string;
  userEmail: string;
}

export class VerifyResetPasswordDto {
  phoneNumber: string;
  otpCode: string;
}

export class ResetPasswordDto {
  newPassword: string;
  otpToken: string;
}

export class NearByPanditFiltersDto {
  userId: string;
  timeSlotId: string;
  bookingDate: Date;
  radiusKm: number = 10;
  categoryId?: string;
}
