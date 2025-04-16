import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getInitializedS3Client } from "../config/aws";
import { CustomError } from "../utils/customError";
import {
  S3_INITIALIZATION_FAILED,
  SIGNED_URL_GENERATION_FAILED,
} from "../utils/messages";
import { S3BucketType } from "../utils/enums";
import { getBucketName } from "../utils/getBucketName";
import { logger } from "../utils/logger";

export const generateSignedUrl = async (
  filePath: string,
  type: S3BucketType
) => {
  const s3 = await getInitializedS3Client();

  if (!s3) {
    throw new CustomError(S3_INITIALIZATION_FAILED);
  }
  const bucketName = getBucketName(type);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: filePath,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  if (!signedUrl) {
    logger.info("🔥 Error generating signed URL");
    throw new CustomError(SIGNED_URL_GENERATION_FAILED);
  }

  return signedUrl;
};
