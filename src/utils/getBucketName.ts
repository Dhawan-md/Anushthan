import { env } from "../config/env";
import { CustomError } from "./customError";
import { S3BucketType } from "./enums";
import { INVALID_BUCKET, MISSING_BUCKET_NAME } from "./messages";

export const getBucketName = (type: S3BucketType): string => {
  if (!env.S3_BUCKET_NAME) {
    throw new CustomError(MISSING_BUCKET_NAME);
  }

  if (type === S3BucketType.IMAGE) return env.S3_BUCKET_NAME;
  if (type === S3BucketType.DOCUMENT) return env.S3_BUCKET_NAME;
  throw new CustomError(INVALID_BUCKET);
};
