// src/scalars/DateOnlyScalar.ts
import { GraphQLScalarType, Kind } from "graphql";

export const DateOnlyScalar = new GraphQLScalarType({
  name: "DateOnly",
  description: "Date (YYYY-MM-DD) without time component",

  // Convert outgoing value for GraphQL responses
  serialize(value: unknown): string {
    // ✅ Handle Date objects (from JS / resolvers)
    if (value instanceof Date) {
      return value.toISOString().split("T")[0];
    }

    // ✅ Handle plain strings (from Postgres DATE column)
    if (typeof value === "string") {
      // Validate simple YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      // Otherwise, try to parse to ISO
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
    }

    throw new Error(`Value is not a Date: ${value}`);
  },

  // Convert incoming variable values (for mutations)
  parseValue(value: unknown): Date {
    if (typeof value !== "string") {
      throw new Error("DateOnlyScalar can only parse string values");
    }
    return new Date(`${value}T00:00:00.000Z`);
  },

  // Convert hardcoded literal values (rarely used)
  parseLiteral(ast): Date {
    if (ast.kind !== Kind.STRING) {
      throw new Error("DateOnlyScalar can only parse string literals");
    }
    return new Date(`${ast.value}T00:00:00.000Z`);
  },
});
