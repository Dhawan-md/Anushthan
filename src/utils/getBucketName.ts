import { CustomError } from "./custumError";
import { s3BucketType } from "./enums";
import { INVALID_BUCKET, MISSING_BUCKET_NAME } from "./messages";

export const getBucketName = (type: s3BucketType): string => {
  if (!process.env["AWS_BUCKET_NAME"]) {
    throw new CustomError(MISSING_BUCKET_NAME);
  }

  if (type === s3BucketType.IMAGE) return process.env["AWS_BUCKET_NAME"];
  if (type === s3BucketType.DOCUMENT) return process.env["AWS_BUCKET_NAME"];
  throw new CustomError(INVALID_BUCKET);
};
