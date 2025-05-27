import { CustomError } from "./customError";

export function validateFoundIds<T extends { id: string }>(
  foundItems: T[],
  expectedIds: string[],
  errorPrefix = "Invalid IDs"
): void {
  const foundIds = new Set(foundItems.map((item) => item.id));
  const missing = expectedIds.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    throw new CustomError(`${errorPrefix}: ${missing.join(", ")}`);
  }
}
