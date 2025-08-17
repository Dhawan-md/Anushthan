import { GraphQLScalarType, Kind } from "graphql";
import { CustomError } from "../../utils/customError";

export const TimeScalar = new GraphQLScalarType({
  name: "Time",
  description: "Custom scalar for time in HH:mm:ss format",
  serialize(value: unknown): string {
    return value as string; // DB → Client
  },
  parseValue(value: unknown): string {
    if (typeof value !== "string") throw new CustomError("Time must be a string");
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value))
      throw new CustomError("Invalid time format (expected HH:mm or HH:mm:ss)");
    return value;
  },
  parseLiteral(ast): string {
    if (ast.kind === Kind.STRING) {
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(ast.value))
        throw new CustomError("Invalid time format (expected HH:mm or HH:mm:ss)");
      return ast.value;
    }
    throw new CustomError("Time must be a string");
  },
});
