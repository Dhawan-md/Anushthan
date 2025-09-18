import { FileUpload } from "graphql-upload-minimal";

export class RegisterUserDto {
  name: string;
  userEmail: string;
  password: string;
  phoneNumber: string;
  profileImage?: FileUpload | null;
}

export class LoginUserDto {
  phoneNumber: string;
}

export class VerifyUserDto {
  phoneNumber: string;
  otpCode: string;
}
