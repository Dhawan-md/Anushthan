import { CustomError } from "./customError";
import { S3BucketType } from "./enums";
import { INVALID_BUCKET, MISSING_BUCKET_NAME } from "./messages";

export const getBucketName = (type: S3BucketType): string => {
  if (!process.env["AWS_BUCKET_NAME"]) {
    throw new CustomError(MISSING_BUCKET_NAME);
  }

  if (type === S3BucketType.IMAGE) return process.env["AWS_BUCKET_NAME"];
  if (type === S3BucketType.PANDIT_DOCUMENTS) return process.env["AWS_BUCKET_NAME"];
  throw new CustomError(INVALID_BUCKET);
};
