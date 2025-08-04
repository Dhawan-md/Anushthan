import { FileUpload } from "graphql-upload-minimal";

export class RegisterUserDto {
  name: string;
  username: string;
  userEmail: string;
  password: string;
  phoneNumber: string;
  profileImage?: FileUpload | null;
  latitude: number;
  longitude: number;
}

export class LoginUserDto {
  userEmail: string;
}

export class VerifyUserDto {
  userEmail: string;
  otpCode: string;
}
