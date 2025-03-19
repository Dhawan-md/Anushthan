import { CustomError } from "../utils/custumError";
import { s3BucketType } from "../utils/enums";
import { INVALID_BUCKET } from "../utils/messages";

export const getBucketName = (type: s3BucketType): string => {

  if (type === s3BucketType.IMAGE) return process.env["AWS_BUCKET_NAME"];
  if (type === s3BucketType.DOCUMENT) return process.env["AWS_BUCKET_NAME"];
  throw new CustomError(INVALID_BUCKET);
};