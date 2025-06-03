import { PaginationDto } from "./Pagination";

export class FiltersDto {
  categoryId?: string;
  minDuration?: number;
  maxDuration?: number;
}

export class GetServicesDto extends PaginationDto {
  filters?: FiltersDto;
}
