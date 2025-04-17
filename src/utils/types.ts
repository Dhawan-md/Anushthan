import { PanditStatus } from "./enums";

export type getPanditParams =
  | { id: string; userEmail?: never }
  | { userEmail: string; id?: never };

export type notifyPanditParams = {
  userEmail: string;
  name: string;
  status: PanditStatus;
};

export type validatePasswordParams = {
  inputPassword: string;
  hashedPassword: string;
};

export type verifyOtpParams = {
  userEmail: string;
  otpCode: string;
};
