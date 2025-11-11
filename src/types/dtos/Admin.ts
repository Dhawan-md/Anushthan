import { FileUpload } from "graphql-upload-minimal";

import { PanditStatus } from "../../utils/enums";
import { PaginationDto } from "./Pagination";

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
  categoryId: string;
  image: FileUpload;
}

export class SetPanditApprovalStatusDto {
  panditId: string;
  status: PanditStatus;
}

export class GetAllPanditsDto extends PaginationDto {
  status?: PanditStatus;
}
