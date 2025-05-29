import { FileUpload } from "graphql-upload-minimal";

export class RegisterUserDto {
  name: string;
  username: string;
  userEmail: string;
  password: string;
  phoneNumber: string;
  profileImage?: FileUpload | null;
}

export class LoginUserDto {
  userEmail: string;
}

export class VerifyUserDto {
  userEmail: string;
  otpCode: string;
}
