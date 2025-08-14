import { FileUpload } from "graphql-upload-minimal";

export class RegisterPanditDto {
  userId: string;
  password: string;
  documents: FileUpload[];
  categoryIds: string[];
  experience: number;
}

export class LoginPanditDto {
  userEmail: string;
  password: string;
}

export class VerifyPanditDto {
  userEmail: string;
  otpCode: string;
}

export class ForgetPasswordDto {
  userEmail: string;
}

export class VerifyResetPasswordDto {
  userEmail: string;
  otpCode: string;
}

export class ResetPasswordDto {
  newPassword: string;
  otpToken: string;
}
