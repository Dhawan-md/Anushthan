import { PaginationDto } from "./Pagination";

export class FiltersDto {
  categoryId: string;
}

export class GetServicesDto extends PaginationDto {
  filters: FiltersDto;
}
