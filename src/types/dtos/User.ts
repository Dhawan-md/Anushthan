import { FileUpload } from "graphql-upload-minimal";

export class RegisterUserDto {
  name: string;
  userEmail: string;
  password: string;
  phoneNumber: string;
  profileImage?: FileUpload | null;
  deviceToken?: string;
}

export class LoginUserDto {
  phoneNumber: string;
  deviceToken?: string;
}

export class VerifyUserDto {
  phoneNumber: string;
  otpCode?: string;
  idToken?: string;
  deviceToken?: string;
}
