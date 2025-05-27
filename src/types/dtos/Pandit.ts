// dto/RegisterPanditDto.ts
import { FileUpload } from "graphql-upload-minimal";

export class RegisterPanditDto {
  userId: string;
  password: string;
  documents: FileUpload[];
  serviceIds: string[];
  experience: number;
  address: string;
}

export class LoginPanditDto {
  userEmail: string;
  password: string;
}

// dto/VerifyPanditDto.ts
export class VerifyPanditDto {
  userEmail: string;
  otpCode: string;
}

// dto/ForgetPasswordDto.ts
export class ForgetPasswordDto {
  userEmail: string;
}

// dto/VerifyResetPasswordDto.ts
export class VerifyResetPasswordDto {
  userEmail: string;
  otpCode: string;
}

// dto/ResetPasswordDto.ts
export class ResetPasswordDto {
  newPassword: string;
  otpToken: string;
}
