import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { getInitializedS3Client } from "../config/aws";
import { CustomError } from "../utils/customError";
import { logger } from "../utils/logger";
import { S3_INITIALIZATION_FAILED } from "../utils/messages";

export const deleteS3File = async (
  bucketName: string,
  fileName: string,
  filePath: string
) => {
  const s3 = await getInitializedS3Client();
  if (!s3) {
    throw new CustomError(S3_INITIALIZATION_FAILED);
  }

  try {
    const deleteFile = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });
    await s3.send(deleteFile);
    logger.info(`🗑️ Rolled back: ${fileName} with file path ${filePath}`);
  } catch (error) {
    logger.error(`⚠️ Failed to delete ${fileName} with file path ${filePath} `);
  }
};
