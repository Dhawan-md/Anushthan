import { GraphQLScalarType, Kind } from "graphql";

export const UploadScalar = new GraphQLScalarType({
  name: "Upload",
  description: "Upload scalar type",
  serialize(value) {
    return value; // Handle serialization if needed
  },
  parseValue(value) {
    return value; // Handle value parsing if needed
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return ast.value; // Handle AST parsing if needed
    }
    return null;
  },
});
