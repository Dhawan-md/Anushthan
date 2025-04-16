import { PanditStatus } from "./enums";

export type getPanditParams =
  | { id: string; userEmail?: never }
  | { userEmail: string; id?: never };

export type notifyPanditParams = {
  userEmail: string;
  name: string;
  status: PanditStatus;
};
