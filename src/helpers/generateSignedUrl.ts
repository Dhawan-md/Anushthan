import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3 } from "../config/aws";
import { CustomError } from "../utils/custumError";
import { S3_INITIALIZATION_FAILED } from "../utils/messages";
import { s3BucketType } from "../utils/enums";
import { getBucketName } from "./getBucketName";

export const generateSignedUrl = async (
  filePath: string,
  type: s3BucketType
) => {
  const bucketName = getBucketName(type);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: filePath,
  });

  if (!s3) {
    throw new CustomError(S3_INITIALIZATION_FAILED);
  }

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return signedUrl;
};
