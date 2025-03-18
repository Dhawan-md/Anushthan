import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3 } from "../config/aws";
import { CustomError } from "../utils/custumError";
import { S3_INITIALIZATION_FAILED } from "../utils/messages";

export const generateSignedUrl = async (filePath: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env["AWS_BUCKET_NAME"],
    Key: filePath,
  });

  if (!s3) {
    throw new CustomError(S3_INITIALIZATION_FAILED);
  }

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return signedUrl;
};
