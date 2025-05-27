import { FileUpload } from "graphql-upload-minimal";

import { PanditStatus } from "./enums";

export type CheckPanditExists =
  | { userId: string; userEmail?: never }
  | { userEmail: string; userId?: never };

export type GetPanditParams =
  | { id: string; userEmail?: never }
  | { userEmail: string; id?: never };

export interface NotifyPanditParams {
  userEmail: string;
  name: string;
  status: PanditStatus;
}

export interface ValidatePasswordParams {
  inputPassword: string;
  hashedPassword: string;
}

export interface VerifyOtpParams {
  userEmail: string;
  otpCode: string;
}

export interface RegisterPanditParams {
  userId: string;
  password: string;
  documents: FileUpload[];
  serviceIds: string[];
  experience: number;
  address: string;
}

export interface AddServiceParams {
  name: string;
  description: string | null;
  price: number;
  duration: number;
}
