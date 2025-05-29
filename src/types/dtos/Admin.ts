import { PanditStatus } from "../../utils/enums";

export class RegisterAdminDto {
  fullName: string;
  email: string;
  password: string;
}

export class LoginAdminDto {
  email: string;
  password: string;
}

export class AddServiceDto {
  name: string;
  description: string;
  price: number;
  duration: number;
}

export class SetPanditApprovalStatusDto {
  panditId: string;
  status: PanditStatus;
}

export class PaginationDto {
  page?: number;
  limit?: number;
}

export class GetAllPanditsDto extends PaginationDto {
  status?: PanditStatus;
}
