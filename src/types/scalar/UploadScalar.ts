import { GraphQLScalarType } from "graphql";

import { CustomError } from "../../utils/customError";

export const UploadScalar = new GraphQLScalarType({
  name: "Upload",
  description: "Custom scalar for handling file uploads.",
  parseValue: (value) => value, // Return the uploaded file
  serialize: () => {
    throw new CustomError("Upload serialization is not supported.");
  },
  parseLiteral: () => {
    throw new CustomError("Upload literal is not supported.");
  },
});
